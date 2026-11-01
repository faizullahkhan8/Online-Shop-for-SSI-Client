import { ErrorResponse } from "../utils/ErrorResponse.js";

// Initial manual receipts and later confirmations use the same posting rules.
export function postFullPayment(order, actor, reference) {
    if (reference !== undefined && (typeof reference !== "string" || reference.length > 200)) throw new ErrorResponse("Payment reference must be text up to 200 characters", 400);
    order.payment.ispaid = true;
    order.payment.paidAmount = order.grandTotal;
    order.payment.paidAt = new Date();
    order.payment.recordedBy = actor._id;
    order.payment.reference = reference?.trim() || `receipt:${order._id}`;
}
