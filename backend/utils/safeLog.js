// Do not log provider payloads, credentials, bodies or database error messages.
export function safeError(event, error, requestId) {
    const type = ["Error", "TypeError", "ValidationError", "CastError", "MongoServerError", "ErrorResponse"].includes(error?.name) ? error.name : "Error";
    console.error(JSON.stringify({ event, type, ...(requestId ? { requestId } : {}) }));
}
