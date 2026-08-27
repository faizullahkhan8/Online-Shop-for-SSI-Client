import expressAsyncHandler from "express-async-handler";
import {
    getLocalOrderModel,
    getLocalProductModel,
    getLocalUserModel,
} from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { getEffectivePrice } from "../utils/promotionHelper.js";
import { emitNewOrder, emitOrderStatusUpdate } from "../config/socket.js";
import { sendSMS } from "../utils/smsService.js";

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
        console.error("[Socket.io] Failed to emit order view update:", socketErr);
    }
    
    res.status(200).json({ success: true, message: "Order marked as viewed" });
});

export const placeOrder = expressAsyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();
    const ProductModel = getLocalProductModel();
    const UserModel = getLocalUserModel();

    if (!OrderModel || !ProductModel || !UserModel) {
        return next(new Error("Order model not found"));
    }

    const {
        items,
        recipient,
        payment,
        userId,
        taxAmount,
        shippingFee,
        shippingMethod,
        status,
    } = req.body;

    if (!Array.isArray(items) || items.length < 1 || !recipient || !payment) {
        return next(new Error("All fields are required"));
    }

    if (
        !recipient.name ||
        !recipient.street ||
        !recipient.city ||
        !recipient.phone
    ) {
        return next(new ErrorResponse("Recipient fields are required", 400));
    }

    if (!payment.method) {
        return next(new ErrorResponse("Payment method is required", 400));
    }

    // Normalize and validate items with current promotional prices
    let normalizedItems;
    try {
        normalizedItems = await Promise.all(
            items.map(async (item) => {
                const quantity = Number(item.quantity) || 0;
                const tempProd = await ProductModel.findById(item.product);
                if (!tempProd) {
                    throw new ErrorResponse(
                        `Product not found: ${item.product}`,
                        404,
                    );
                }

                // SECURITY: Re-calculate the price on server side
                const { price: effectivePrice } = await getEffectivePrice(
                    tempProd._id,
                    tempProd.price,
                );

                if (quantity <= 0) {
                    throw new ErrorResponse(
                        "Item quantity must be greater than 0",
                        400,
                    );
                }

                if (tempProd.stock < quantity) {
                    throw new ErrorResponse(
                        `Product ${tempProd.name} is out of stock or requested quantity exceeds available stock`,
                        400,
                    );
                }

                return {
                    product: item.product,
                    quantity,
                    price: effectivePrice,
                    totalAmount: effectivePrice * quantity,
                };
            }),
        );
    } catch (error) {
        return next(error);
    }

    let orderUserId = req.user?._id;
    if (req.user?.role === "admin" && userId) {
        const userExists = await UserModel.findById(userId);
        if (!userExists) {
            return next(new ErrorResponse("User not found", 404));
        }
        orderUserId = userId;
    }

    // Process stock and sold count
    for (const prod of normalizedItems) {
        const tempProd = await ProductModel.findById(prod.product);
        tempProd.stock -= prod.quantity;
        tempProd.sold += prod.quantity;
        await tempProd.save({ validateModifiedOnly: true });
    }

    const itemsTotal = normalizedItems.reduce(
        (sum, item) => sum + item.totalAmount,
        0,
    );
    const computedTax = Number(taxAmount) || 0;
    const computedShipping = Number(shippingFee) || 0;
    if (computedTax < 0 || computedShipping < 0) {
        return next(
            new ErrorResponse("Tax and shipping must be valid amounts", 400),
        );
    }
    const computedGrandTotal = itemsTotal + computedTax + computedShipping;

    const order = new OrderModel({
        userId: orderUserId,
        items: normalizedItems,
        taxAmount: computedTax,
        shippingFee: computedShipping,
        shippingMethod,
        grandTotal: computedGrandTotal,
        recipient,
        payment,
        status: status ?? "pending",
    });

    await order.save();

    // Populate for real-time socket payload
    const populatedOrder = await OrderModel.findById(order._id)
        .populate("items.product")
        .populate("userId", "name email phone");

    // Real-time socket broadcast to Admins
    try {
        emitNewOrder(populatedOrder || order);
    } catch (socketErr) {
        console.error("[Socket.io] Failed to emit new order:", socketErr);
    }

    // Send SMS
    if (recipient && recipient.phone) {
        await sendSMS("ORDER_PLACED", recipient.phone, {
            name: recipient.name || "Customer",
            orderId: order._id.toString(),
            amount: computedGrandTotal
        });
    }

    return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order,
    });
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
            console.error("[Socket.io] Failed to emit order view update:", socketErr);
        }
    }

    return res
        .status(200)
        .json({ success: true, message: "Order fetched.", order });
});

export const updateOrderStatus = expressAsyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();
    if (!OrderModel) return next(new ErrorResponse("Model not found!", 400));

    const { status } = req.body;

    const order = await OrderModel.findById(req.params.id);
    if (!order) return next(new ErrorResponse("Order not found", 404));

    order.status = status ?? order.status;
    await order.save({ validateModifiedOnly: true });

    const populatedOrder = await OrderModel.findById(order._id)
        .populate("userId")
        .populate("items.product");

    try {
        emitOrderStatusUpdate(populatedOrder);
    } catch (socketErr) {
        console.error("[Socket.io] Failed to emit order status update:", socketErr);
    }

    // Send SMS
    if (populatedOrder.recipient && populatedOrder.recipient.phone) {
        await sendSMS("ORDER_UPDATE", populatedOrder.recipient.phone, {
            name: populatedOrder.recipient.name || "Customer",
            orderId: populatedOrder._id.toString(),
            status: status
        });
    }

    return res.status(200).json({
        success: true,
        message: "Order updated.",
        order: populatedOrder,
    });
});

export const updatePaymentStatus = expressAsyncHandler(
    async (req, res, next) => {
        const OrderModel = getLocalOrderModel();
        if (!OrderModel)
            return next(new ErrorResponse("Model not found!", 400));

        const { ispaid } = req.body;

        const order = await OrderModel.findById(req.params.id);
        if (!order) return next(new ErrorResponse("Order not found", 404));

        order.payment = {
            ...order.payment,
            ispaid: Boolean(ispaid),
        };

        await order.save({ validateModifiedOnly: true });

        const populatedOrder = await OrderModel.findById(order._id)
            .populate("userId")
            .populate("items.product");

        return res.status(200).json({
            success: true,
            message: "Payment status updated.",
            order: populatedOrder,
        });
    },
);

export const deleteOrder = expressAsyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();

    if (!OrderModel) return next(new ErrorResponse("Model not found!", 400));

    const order = await OrderModel.findById(req.params.id);

    if (!order) return next(new ErrorResponse("Order not found", 404));

    // only admin can delete orders
    if (req.user.role !== "admin") {
        return next(
            new ErrorResponse("Not authorized to delete this order", 403),
        );
    }

    order.isDeleted = true;
    await order.save({ validateModifiedOnly: true });

    return res.status(200).json({ success: true, message: "Order deleted." });
});

export const cancelOrder = expressAsyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();
    const ProductModel = getLocalProductModel();

    if (!OrderModel || !ProductModel)
        return next(new ErrorResponse("Model not found!", 400));

    const { reason } = req.body;
    const order = await OrderModel.findById(req.params.id);

    if (!order) return next(new ErrorResponse("Order not found", 404));

    // Ensure user owns the order (if not admin)
    if (
        req.user.role !== "admin" &&
        order.userId.toString() !== req.user._id.toString()
    ) {
        return next(
            new ErrorResponse("Not authorized to cancel this order", 403),
        );
    }

    if (order.status !== "pending") {
        return next(
            new ErrorResponse("Only pending orders can be cancelled", 400),
        );
    }

    order.status = "cancelled";
    order.cancellationReason = reason || "No reason provided";
    order.cancelledBy = req.user._id;

    // Restore stock
    for (const item of order.items) {
        if (item.status !== "cancelled") {
            const product = await ProductModel.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                product.sold -= item.quantity;
                await product.save({ validateModifiedOnly: true });
            }
            item.status = "cancelled"; // Mark all items as cancelled
        }
    }

    await order.save({ validateModifiedOnly: true });

    return res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        order,
    });
});

export const cancelOrderItem = expressAsyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();
    const ProductModel = getLocalProductModel();

    if (!OrderModel || !ProductModel)
        return next(new ErrorResponse("Model not found!", 400));

    const { itemId } = req.params;
    const { reason } = req.body;

    const order = await OrderModel.findById(req.params.id);

    if (!order) return next(new ErrorResponse("Order not found", 404));

    // Find the item
    const itemIndex = order.items.findIndex(
        (item) => item._id.toString() === itemId,
    );

    if (itemIndex === -1) {
        return next(new ErrorResponse("Item not found in order", 404));
    }

    const item = order.items[itemIndex];

    if (item.status === "cancelled") {
        return next(new ErrorResponse("Item is already cancelled", 400));
    }

    // Update item status
    item.status = "cancelled";
    item.cancellationReason = reason || "Admin cancelled item";
    item.cancelledBy = req.user._id;

    // Restore stock
    const product = await ProductModel.findById(item.product);
    if (product) {
        product.stock += item.quantity;
        product.sold -= item.quantity;
        await product.save({ validateModifiedOnly: true });
    }

    // Recalculate totals
    // We subtract the item's totalAmount from grandTotal
    // Note: tax and shipping might need adjustment based on business logic,
    // but for now we'll just subtract the item cost.
    order.grandTotal -= item.totalAmount;
    if (order.grandTotal < 0) order.grandTotal = 0;

    await order.save({ validateModifiedOnly: true });

    // Populate for response
    const populatedOrder = await OrderModel.findById(order._id)
        .populate("userId")
        .populate("items.product");

    return res.status(200).json({
        success: true,
        message: "Item cancelled successfully",
        order: populatedOrder,
    });
});

export const getDashboardStats = expressAsyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();
    const ProductModel = getLocalProductModel();
    const UserModel = getLocalUserModel();

    if (!OrderModel || !ProductModel || !UserModel) {
        return next(new ErrorResponse("Model not found!", 400));
    }

    // Get date range from query params
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = { isDeleted: false };
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) {
            dateFilter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.createdAt.$lte = new Date(endDate);
        }
    }

    // Apply date filter to orders
    const orders = await OrderModel.find(dateFilter).populate("items.product");
    const totalSales = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const totalOrders = orders.length;

    const totalProducts = await ProductModel.countDocuments();
    const totalUsers = await UserModel.countDocuments();

    // 1. Daily Sales
    // Use provided start date or default to 30 days ago
    let salesStartDate;
    if (startDate) {
        salesStartDate = new Date(startDate);
    } else {
        salesStartDate = new Date();
        salesStartDate.setDate(salesStartDate.getDate() - 30);
    }

    const dailySalesFilter = {
        createdAt: { $gte: salesStartDate },
        isDeleted: false,
    };

    if (endDate) {
        dailySalesFilter.createdAt.$lte = new Date(endDate);
    }

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
        stock: { $gt: 0, $lte: 5 },
    }).select("name stock price image");

    return res.status(200).json({
        success: true,
        stats: {
            totalSales,
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
