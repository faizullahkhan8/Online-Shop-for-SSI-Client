import { getLocalOrderModel, getLocalProductModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";

const money = value => Math.round(value * 100) / 100;

// Every inventory/payment mutation shares the order document as its transaction lock.
export async function changeOrder(id, actor, action, data = {}) {
    if (!/^[a-f\d]{24}$/i.test(id)) throw new ErrorResponse("Invalid order ID", 400);
    const Order = getLocalOrderModel();
    let changed = false;
    await Order.db.transaction(async session => {
        changed = false;
        const order = await Order.findOne({ _id: id, isDeleted: false }).session(session);
        if (!order) throw new ErrorResponse("Order not found", 404);
        if (actor.role !== "admin" && (action !== "cancel" || String(order.userId) !== String(actor._id)))
            throw new ErrorResponse("Not authorized", 403);
        if (action === "status" && data.status === "cancelled") action = "cancel";
        if (action === "cancel" || action === "cancelItem") {
            const item = action === "cancelItem" ? order.items.id(data.itemId) : null;
            if (action === "cancelItem" && !item) throw new ErrorResponse("Item not found", 404);
            if (order.status === "cancelled" || item?.status === "cancelled") return;
            if (order.status !== "pending") throw new ErrorResponse("Only pending orders can be cancelled", 409);
            const paidAmount = order.payment.paidAmount ?? order.grandTotal;
            const targets = item ? [item] : order.items.filter(line => line.status !== "cancelled");
            let removed = 0;
            for (const line of targets) {
                const result = await getLocalProductModel().updateOne({ _id: line.product },
                    { $inc: { stock: line.quantity, sold: -line.quantity } }, { session });
                if (!result.matchedCount) throw new ErrorResponse("Cannot restore stock: product missing", 409);
                line.status = "cancelled";
                line.cancellationReason = typeof data.reason === "string" ? data.reason.slice(0, 1000) : "Cancelled";
                line.cancelledBy = actor._id;
                removed += line.totalAmount;
            }
            const allCancelled = order.items.every(line => line.status === "cancelled");
            order.grandTotal = allCancelled ? 0 : money(Math.max(0, order.grandTotal - removed));
            if (order.payment.ispaid) {
                order.payment.paidAmount = paidAmount;
                order.refundDue = allCancelled ? paidAmount : money((order.refundDue || 0) + removed);
            }
            if (allCancelled) {
                order.status = "cancelled";
                order.taxAmount = 0;
                order.shippingFee = 0;
                order.cancellationReason = targets[0]?.cancellationReason || "Cancelled";
                order.cancelledBy = actor._id;
            }
        } else if (action === "status") {
            if (data.status === order.status) return;
            if (!({ pending: ["shipped"], shipped: ["delivered"] }[order.status] || []).includes(data.status))
                throw new ErrorResponse("Invalid order status transition", 409);
            order.status = data.status;
        } else if (action === "payment") {
            if (typeof data.ispaid !== "boolean") throw new ErrorResponse("ispaid must be boolean", 400);
            if (data.ispaid === order.payment.ispaid) return;
            if (!data.ispaid || order.status === "cancelled") throw new ErrorResponse("Payment cannot be reversed; record a refund instead", 409);
            order.payment.ispaid = true;
            order.payment.paidAmount = order.grandTotal;
            order.payment.paidAt = new Date();
        } else if (action === "refund") {
            const { amount, reference } = data;
            if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || money(amount) !== amount || typeof reference !== "string" || !reference.trim() || reference.length > 200)
                throw new ErrorResponse("Provide a positive refund amount and transaction reference", 400);
            const previous = order.refunds.find(refund => refund.reference === reference.trim());
            if (previous) {
                if (previous.amount !== amount) throw new ErrorResponse("Reference already recorded with a different amount", 409);
                return;
            }
            const recorded = order.refunds.reduce((sum, refund) => sum + refund.amount, 0);
            if (amount > money(order.refundDue - recorded)) throw new ErrorResponse("Amount exceeds outstanding refund", 409);
            order.refunds.push({ amount, reference: reference.trim(), recordedBy: actor._id, recordedAt: new Date() });
        } else if (action === "delete") {
            if (!["delivered", "cancelled"].includes(order.status) || money(order.refundDue - order.refunds.reduce((sum, refund) => sum + refund.amount, 0)) > 0)
                throw new ErrorResponse("Complete or cancel the order and settle refunds before archiving", 409);
            order.isDeleted = true;
        } else throw new ErrorResponse("Unknown order action", 400);
        await order.save({ session });
        changed = true;
    });
    return { order: await Order.findById(id).populate("userId").populate("items.product"), changed };
}
