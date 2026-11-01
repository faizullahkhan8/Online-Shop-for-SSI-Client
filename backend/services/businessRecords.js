import { Schema } from "mongoose";
import { getLocalOrderModel } from "../config/localDb.js";

const movementSchema = new Schema({
    key: { type: String, required: true, unique: true }, requestHash: String,
    product: { type: Schema.Types.ObjectId, required: true }, variantId: Schema.Types.ObjectId,
    delta: { type: Number, required: true }, balance: Number, reason: String,
    actor: Schema.Types.ObjectId, sourceType: String, sourceId: String,
}, { timestamps: { createdAt: true, updatedAt: false } });
const eventSchema = new Schema({
    key: { type: String, required: true, unique: true }, aggregate: String,
    recordId: { type: Schema.Types.ObjectId, required: true }, action: String,
    actor: Schema.Types.ObjectId, reason: String, details: Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } });
const outboxSchema = new Schema({
    key: { type: String, required: true, unique: true }, sourceType: String,
    sourceId: Schema.Types.ObjectId, eventName: String,
    encryptedPayload: { type: String, required: true, select: false },
    status: { type: String, enum: ["pending", "processing", "accepted", "blocked", "unknown"], default: "pending" },
    attempts: { type: Number, default: 0 }, leaseUntil: Date,
    provider: String, messageId: String, errorCode: String,
    history: [{ actor: Schema.Types.ObjectId, action: String, reason: String, reference: String, at: Date }],
}, { timestamps: true });
outboxSchema.index({ status: 1, createdAt: 1 });

export function businessModels() {
    const db = getLocalOrderModel().db;
    const model = (name, schema) => db.models[name] || db.model(name, schema);
    return { Movement: model("StockMovement", movementSchema), Event: model("BusinessEvent", eventSchema), Outbox: model("NotificationOutbox", outboxSchema) };
}
let prepared;
export async function prepareBusinessRecords() {
    if (!prepared) prepared = Promise.all(Object.values(businessModels()).map(model => model.init())).catch(error => { prepared = undefined; throw error; });
    await prepared;
}
export async function recordEvent(session, { key, aggregate, recordId, action, actor, reason, details }) {
    const { Event } = businessModels();
    await Event.create([{ key, aggregate, recordId, action, actor, reason, details }], { session });
}
export async function recordMovement(session, data) {
    await businessModels().Movement.create([data], { session });
}
