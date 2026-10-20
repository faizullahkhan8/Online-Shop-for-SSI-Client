import { createHash } from "node:crypto";
import { ErrorResponse } from "./ErrorResponse.js";

const canonical = value => Array.isArray(value) ? value.map(canonical) :
    value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;

export function checkoutKey(req) {
    const key = req.get("Idempotency-Key");
    if (typeof key !== "string" || !/^[a-zA-Z0-9_-]{16,128}$/.test(key))
        throw new ErrorResponse("A valid Idempotency-Key header is required", 400);
    return {
        checkoutKey: createHash("sha256").update(`${req.user._id}:${key}`).digest("hex"),
        checkoutHash: createHash("sha256").update(JSON.stringify(canonical(req.body))).digest("hex"),
    };
}

export function replayOrder(order, hash) {
    if (order.checkoutHash !== hash) throw new ErrorResponse("Checkout key was already used for a different request", 409);
    return order;
}
