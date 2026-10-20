import { Schema } from "mongoose";

const schema = new Schema({
    eventName: { type: String, maxlength: 80 },
    provider: { type: String, match: /^[a-z][a-z0-9_]{0,63}$/ },
    status: { type: String, enum: ["accepted", "rejected", "unknown", "skipped"] },
    messageId: { type: String, maxlength: 150 },
    errorCode: { type: String, maxlength: 80 },
    createdAt: { type: Date, default: Date.now, expires: 7 * 24 * 60 * 60 },
});
// No message bodies, OTPs, recipient numbers or credentials are persisted here.
export default schema;
