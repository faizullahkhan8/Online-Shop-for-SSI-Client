import { postFullPayment } from "../services/paymentPosting.js";
import { prepareBusinessRecords, recordEvent, recordMovement } from "../services/businessRecords.js";
import { enqueueNotification } from "../services/notificationOutbox.js";
import { profileAddresses } from "../utils/profileAddresses.js";
import { safeError } from "../utils/safeLog.js";
import { checkoutKey, replayOrder } from "../utils/checkoutKey.js";
import { changeOrder } from "../services/orderLifecycle.js";
import expressAsyncHandler from "express-async-handler";
import {
    getLocalOrderModel,
    getLocalProductModel,
    getLocalUserModel,
    getLocalSettingsModel,
} from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { getEffectivePrice } from "../utils/promotionHelper.js";
import { emitNewOrder, emitOrderStatusUpdate } from "../config/socket.js";
import { calculateOrderCharges, customerPaymentMethod, money, nonNegativeAmount } from "../utils/orderPricing.js";

export const getUnreadOrdersCount = expressAsyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();
    if (!OrderModel) return next(new ErrorResponse("Model not found", 400));
    const count = await OrderModel.countDocuments({ isViewed: { $ne: true }, isDeleted: false });
    res.status(200).json({ success: true, count });
});

export const markOrderViewed = expressAsyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();
    if (!OrderModel) return next(new ErrorResponse("Order model not found", 500));

    const order = await OrderModel.findById(req.params.id);
    if (!order) return next(new ErrorResponse("Order not found", 404));

    order.isViewed = true;
    await order.save({ validateModifiedOnly: true });

    try {
        emitOrderStatusUpdate(order);
    } catch (socketErr) {
        safeError("[Socket.io] Failed to emit order view update:", socketErr);
    }

    res.status(200).json({ success: true, message: "Order marked as viewed" });
});

export const placeOrder = expressAsyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();
    const ProductModel = getLocalProductModel();
    const UserModel = getLocalUserModel();
    const SettingsModel = getLocalSettingsModel();
    if (!OrderModel || !ProductModel || !UserModel || !SettingsModel) {
        return next(new ErrorResponse("Order models are unavailable", 500));
    }

    const { items, recipient, payment, userId } = req.body;
    if (recipient && (recipient.lat != null || recipient.lng != null)) {
        try { profileAddresses([recipient]); }
        catch { return next(new ErrorResponse("Invalid delivery coordinates", 400)); }
    }
    const isAdmin = req.user.role === "admin";
    let order;
    const identity = checkoutKey(req);
    const replay = async () => {
        const existing = await OrderModel.findOne({ checkoutKey: identity.checkoutKey }).select("+checkoutHash");
        if (!existing) return false;
        replayOrder(existing, identity.checkoutHash);
        existing.checkoutHash = undefined;
        res.status(200).json({ success: true, message: "Order already placed", order: existing });
        return true;
    };
    if (await replay()) return;
    await OrderModel.init();
    await prepareBusinessRecords();
    try {
        if (!Array.isArray(items) || !items.length || !recipient || !payment ||
            ["name", "street", "city", "phone"].some((field) =>
                typeof recipient[field] !== "string" || !recipient[field].trim()) ||
            typeof payment.method !== "string" || !payment.method.trim()) {
            throw new ErrorResponse("Items, recipient details, and payment method are required", 400);
        }
        for (const field of ["taxAmount", "shippingFee"]) {
            if (req.body[field] !== undefined) nonNegativeAmount(req.body[field], field);
        }
        if (isAdmin && payment.ispaid !== undefined && typeof payment.ispaid !== "boolean") {
            throw new ErrorResponse("Payment status must be a boolean", 400);
        }
        const status = isAdmin ? (req.body.status ?? "pending") : "pending";
        if (!["pending", "shipped", "delivered", "cancelled"].includes(status)) {
            throw new ErrorResponse("Invalid order status", 400);
        }
        if (status === "cancelled") {
            throw new ErrorResponse("Create a pending order before cancelling it", 400);
        }

        const quantities = new Map();
        for (const item of items) {
            if (!item || !/^[0-9a-fA-F]{24}$/.test(String(item.product))) {
                throw new ErrorResponse("Invalid product ID", 400);
            }
            const quantity = Number(item.quantity);
            if (!["number", "string"].includes(typeof item.quantity) ||
                !Number.isSafeInteger(quantity) || quantity <= 0) {
                throw new ErrorResponse("Item quantity must be a positive integer", 400);
            }
            if (item.variantId != null && !/^[0-9a-fA-F]{24}$/.test(String(item.variantId))) throw new ErrorResponse("Invalid variant ID", 400);
            const id = String(item.product).toLowerCase() + (item.variantId ? `:${String(item.variantId).toLowerCase()}` : "");
            const combined = (quantities.get(id) || 0) + quantity;
            if (!Number.isSafeInteger(combined)) throw new ErrorResponse("Invalid quantity", 400);
            quantities.set(id, combined);
        }

        // The conditional stock updates and order insert commit or roll back together.
        // Deployment must use a MongoDB replica set or sharded cluster.
        order = await OrderModel.db.transaction(async (session) => {
            let orderUserId = req.user._id;
            if (isAdmin && userId) {
                const customer = await UserModel.findById(userId).session(session);
                if (!customer) throw new ErrorResponse("User not found", 404);
                orderUserId = customer._id;
            }
            const normalizedItems = [];
            // A stable ordering also reduces contention for multi-product orders.
            for (const [lineKey, quantity] of [...quantities].sort()) {
                const [productId, variantId] = lineKey.split(":");
                const product = await ProductModel.findById(productId).session(session);
                if (!product || product.isArchived) throw new ErrorResponse("Product not found", 404);
                const activeVariants = product.variants.filter(variant => variant.active !== false);
                if (product.variants.length && !activeVariants.length) throw new ErrorResponse("Product variants are unavailable", 400);
                const selectedVariant = variantId ? product.variants.id(variantId) : null;
                if (variantId && (!selectedVariant || selectedVariant.active === false)) throw new ErrorResponse("Selected variant is unavailable", 400);
                if (activeVariants.length && !selectedVariant) throw new ErrorResponse("Choose a product variant", 400);
                const usesSharedStock = Boolean(selectedVariant && activeVariants.every(variant => variant.stock === 0) && product.stock > 0);
                const availableStock = selectedVariant && !usesSharedStock ? selectedVariant.stock : product.stock;
                if (availableStock < quantity) {
                    throw new ErrorResponse(`Insufficient stock for ${product.name}`, 400);
                }
                const basePrice = selectedVariant ? selectedVariant.price : product.price;
                const { price } = await getEffectivePrice(product._id, basePrice, { session });
                nonNegativeAmount(price, "Product price");
                const unitPrice = money(price);
                normalizedItems.push({ product: productId, snapshotSource: "checkout", name: product.name, sku: selectedVariant?.sku || "", packSize: product.packSize || "", image: product.image || "", variantId: selectedVariant?._id,
                    variantName: selectedVariant?.name || "", variantSku: selectedVariant?.sku || "", usesSharedStock,
                    quantity, price: unitPrice, originalPrice: money(basePrice), totalAmount: money(unitPrice * quantity) });
            }
            const subtotal = money(normalizedItems.reduce((sum, item) => sum + item.totalAmount, 0));
            const settings = await SettingsModel.findOne().session(session).lean() || {};
            const pricingSettings = isAdmin && req.body.shippingFee !== undefined
                ? { ...settings, advancedShipping: undefined } : settings;
            const charges = calculateOrderCharges(pricingSettings, subtotal, recipient);
            if (isAdmin) {
                // Manual orders retain the administrator's authorized overrides.
                if (req.body.taxAmount !== undefined) charges.taxAmount = money(Number(req.body.taxAmount));
                if (req.body.shippingFee !== undefined) charges.shippingFee = money(Number(req.body.shippingFee));
                if (req.body.shippingMethod) charges.shippingMethod = req.body.shippingMethod;
            }
            const method = isAdmin ? payment.method.trim() : customerPaymentMethod(settings, payment.method);
            const grandTotal = money(subtotal + charges.taxAmount + charges.shippingFee);
            nonNegativeAmount(grandTotal, "Order total");
            const candidate = new OrderModel({ ...identity, businessMigrationVersion: 1, pricingVersion: "unit-rounded-v1", userId: orderUserId, items: normalizedItems,
                ...charges, recipient, payment: { method, ispaid: isAdmin ? (payment.ispaid ?? false) : false },
                status, grandTotal, originalGrandTotal: grandTotal });
            candidate.history.push({ action: "placed", actor: req.user._id, at: new Date(), to: status });
            if (candidate.payment.ispaid) {
                postFullPayment(candidate, req.user, payment.reference);
                candidate.history.push({ action: "payment_recorded", actor: req.user._id, at: candidate.payment.paidAt, reference: candidate.payment.reference });
            }
            await candidate.validate();
            for (const item of normalizedItems) {
                const variantStock = item.variantId && !item.usesSharedStock;
                const updated = await ProductModel.findOneAndUpdate(
                    { _id: item.product, isArchived: { $ne: true }, stock: { $gte: item.quantity }, ...(variantStock ? {
                        variants: { $elemMatch: { _id: item.variantId, active: { $ne: false }, stock: { $gte: item.quantity } } }
                    } : {}) },
                    { $inc: { revision: 1, stock: -item.quantity, sold: item.quantity, ...(variantStock ? { "variants.$.stock": -item.quantity } : {}) } },
                    { session, returnDocument: "after" },
                );
                if (!updated) throw new ErrorResponse("Stock changed. Please refresh your cart", 409);
                await recordMovement(session, { key: `sale:${candidate._id}:${item.product}:${item.variantId || "shared"}`, product: item.product, variantId: item.variantId, delta: -item.quantity, balance: variantStock ? updated.variants.id(item.variantId).stock : updated.stock, actor: req.user._id, reason: "Order placed", sourceType: "order", sourceId: String(candidate._id) });
            }
            await candidate.save({ session });
            await recordEvent(session, { key: `order:${candidate._id}:placed`, aggregate: "order", recordId: candidate._id, action: "placed", actor: req.user._id, details: { total: grandTotal, currency: candidate.currency, taxAmount: charges.taxAmount, shippingFee: charges.shippingFee, shippingMethod: charges.shippingMethod } });
            await enqueueNotification(session, { key: `order:${candidate._id}:placed`, sourceType: "order", sourceId: candidate._id, eventName: "ORDER_PLACED", phone: recipient.phone, payload: { name: recipient.name, orderId: String(candidate._id), amount: grandTotal } });
            return candidate;
        });
    } catch (error) {
        if (await replay()) return;
        if (error.code === 20 && /transaction/i.test(error.message)) {
            return next(new ErrorResponse("Checkout requires a MongoDB replica set or sharded cluster", 503));
        }
        return next(error);
    }

    // External notifications only run after the transaction has committed.
    try {
        const populated = await OrderModel.findById(order._id)
            .populate("items.product").populate("userId", "name email phone");
        emitNewOrder(populated || order);
    } catch (error) {
        safeError("Order saved but notification failed:", error);
    }
    order.checkoutKey = undefined;
    order.checkoutHash = undefined;
    return res.status(201).json({ success: true, message: "Order placed successfully", order });
});

export const getAllOrder = expressAsyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();

    if (!OrderModel) return next(new ErrorResponse("Model not found!", 400));

    const allOrders = await OrderModel.find({ isDeleted: false })
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        message: "All orders fetched.",
        orders: allOrders,
    });
});

export const getUserOrders = expressAsyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();

    if (!OrderModel) return next(new ErrorResponse("Model not found!", 400));

    const orders = await OrderModel.find({
        userId: req.user._id,
        isDeleted: false,
    })
        .populate({
            path: "items.product",
            model: "Product",
        })
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json({ success: true, message: "User orders fetched.", orders });
});

export const getOrderById = expressAsyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();

    if (!OrderModel) return next(new ErrorResponse("Model not found!", 400));

    const order = await OrderModel.findOne({
        _id: req.params.id,
        isDeleted: false,
        ...(req.user.role === "admin" ? {} : { userId: req.user._id }),
    })
        .populate({
            path: "items.product",
            model: "Product",
        })
        .populate("userId");

    if (!order) return next(new ErrorResponse("Order not found", 404));

    if (req.user?.role === "admin" && !order.isViewed) {
        order.isViewed = true;
        await order.save({ validateModifiedOnly: true });

        try {
            emitOrderStatusUpdate(order);
        } catch (socketErr) {
            safeError("[Socket.io] Failed to emit order view update:", socketErr);
        }
    }

    return res
        .status(200)
        .json({ success: true, message: "Order fetched.", order });
});

const lifecycleHandler = action => expressAsyncHandler(async (req, res) => {
    const { order, changed } = await changeOrder(req.params.id, req.user, action, { ...req.body, itemId: req.params.itemId });
    if (changed) {
        try { emitOrderStatusUpdate(order); } catch (error) { safeError("Order notification failed", error); }
    }
    res.json({ success: true, message: "Order updated.", order });
});
export const updateOrderStatus = lifecycleHandler("status");
export const updatePaymentStatus = lifecycleHandler("payment");
export const deleteOrder = lifecycleHandler("delete");
export const cancelOrder = lifecycleHandler("cancel");
export const cancelOrderItem = lifecycleHandler("cancelItem");
export const recordRefund = lifecycleHandler("refund");

export const getDashboardStats = expressAsyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();
    const ProductModel = getLocalProductModel();
    const UserModel = getLocalUserModel();

    if (!OrderModel || !ProductModel || !UserModel) {
        return next(new ErrorResponse("Model not found!", 400));
    }

    const end = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const start = req.query.startDate ? new Date(req.query.startDate) : new Date(end.getTime() - 30 * 86400000);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end) {
        return next(new ErrorResponse("Invalid dashboard date range", 400));
    }
    const dateFilter = { isDeleted: false, createdAt: { $gte: start, $lte: end } };
    const duration = end.getTime() - start.getTime() + 1;
    const previousStart = new Date(start.getTime() - duration);
    const previousEnd = new Date(start.getTime() - 1);
    const orders = await OrderModel.find(dateFilter).select("grandTotal status payment").lean();
    const previousOrders = await OrderModel.find({ isDeleted: false,
        createdAt: { $gte: previousStart, $lte: previousEnd } }).select("grandTotal status payment").lean();
    const collectedRevenue = list => list.reduce((total, order) =>
        total + (order.payment?.ispaid && order.status !== "cancelled" ? (order.grandTotal || 0) : 0), 0);
    const totalSales = collectedRevenue(orders);
    const totalOrders = orders.length;
    const validOrders = orders.filter(order => order.status !== "cancelled");
    const averageOrderValue = validOrders.length ? validOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0) / validOrders.length : 0;
    const percentageChange = (current, previous) => previous === 0 ? null : Math.round((current - previous) / previous * 1000) / 10;
    const trends = { revenue: percentageChange(totalSales, collectedRevenue(previousOrders)),
        orders: percentageChange(totalOrders, previousOrders.length) };
    const totalProducts = await ProductModel.countDocuments();
    const totalUsers = await UserModel.countDocuments();
    const dailySalesFilter = { ...dateFilter, "payment.ispaid": true, status: { $ne: "cancelled" } };

    const dailySales = await OrderModel.aggregate([
        {
            $match: dailySalesFilter,
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                total: { $sum: "$grandTotal" },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const categoryStats = await ProductModel.aggregate([
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 },
                totalSold: { $sum: "$sold" },
            },
        },
        {
            $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "categoryInfo",
            },
        },
        { $unwind: "$categoryInfo" },
        {
            $project: {
                name: "$categoryInfo.name",
                count: 1,
                totalSold: 1,
            },
        },
    ]);

    // 3. Order Status Analysis - filtered by date
    const orderStatusStats = await OrderModel.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);

    // 4. Inventory Alerts
    const outOfStockItems = await ProductModel.find({
        $or: [
            { stock: 0 },
            { stock: { $lte: 0 } },
            { stock: null },
            { stock: { $exists: false } },
        ],
    }).select("name stock price image");

    const lowStockItems = await ProductModel.find({
        stock: { $gt: 0 },
        $expr: { $lte: ["$stock", { $cond: [
            { $and: [{ $isNumber: "$lowStock" }, { $gte: ["$lowStock", 0] }] }, "$lowStock", 5
        ] }] },
    }).select("name stock price image");

    return res.status(200).json({
        success: true,
        stats: {
            totalSales,
            averageOrderValue,
            trends,
            comparison: { startDate: previousStart, endDate: previousEnd },
            revenueDefinition: "Paid, non-cancelled orders created in the selected period",
            totalOrders,
            totalProducts,
            totalUsers,
            dailySales,
            categoryStats,
            orderStatusStats,
            inventory: {
                outOfStock: outOfStockItems,
                lowStock: lowStockItems,
                outOfStockCount: outOfStockItems.length,
                lowStockCount: lowStockItems.length,
            },
        },
    });
});
