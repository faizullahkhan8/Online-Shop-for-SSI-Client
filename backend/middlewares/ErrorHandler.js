import { randomUUID } from "node:crypto";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { safeError } from "../utils/safeLog.js";
export const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);
    const requestId = randomUUID();
    let status = 500, message = "Something went wrong. Please try again.";
    if (err instanceof ErrorResponse && err.statusCode >= 400 && err.statusCode < 500) {
        status = err.statusCode; message = err.message;
    } else if (err.code === 11000) {
        status = 409; message = "A record with these details already exists.";
    } else if (["CastError", "ValidationError"].includes(err.name) || err.type === "entity.parse.failed") {
        status = 400; message = "Invalid request data.";
    } else if (err.type === "entity.too.large") {
        status = 413; message = "Request body is too large.";
    }
    if (status === 500) safeError("request_failed", err, requestId);
    return res.status(status).json({ success: false, message, requestId });
};
