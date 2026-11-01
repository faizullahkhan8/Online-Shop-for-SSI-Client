import { encrypt, decrypt } from "../utils/encryption.js";
import { businessModels, prepareBusinessRecords } from "./businessRecords.js";
import { sendSMSResult } from "../utils/smsService.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";

export async function enqueueNotification(session, { key, sourceType, sourceId, eventName, phone, payload }) {
    // Business notifications only. OTPs stay in their existing synchronous verification flow.
    if (!phone) return;
    await businessModels().Outbox.create([{ key, sourceType, sourceId, eventName, encryptedPayload: encrypt(JSON.stringify({ phone, payload })) }], { session });
}

export async function processNotificationOutbox({ sender = sendSMSResult, limit = 10, now = new Date() } = {}) {
    await prepareBusinessRecords();
    const { Outbox } = businessModels();
    // An expired lease can mean accepted-but-response-lost. Never resend it automatically.
    await Outbox.updateMany({ status: "processing", leaseUntil: { $lte: now } }, { $set: { status: "unknown", errorCode: "worker_lease_expired" } });
    for (let i = 0; i < limit; i++) {
        const event = await Outbox.findOneAndUpdate({ status: "pending" }, { $set: { status: "processing", leaseUntil: new Date(now.getTime() + 120000) }, $inc: { attempts: 1 } }, { sort: { createdAt: 1 }, returnDocument: "after" }).select("+encryptedPayload");
        if (!event) break;
        let result, payload;
        try {
            const raw = decrypt(event.encryptedPayload);
            if (!raw) throw new Error("Unreadable payload");
            payload = JSON.parse(raw);
        } catch { result = { status: "skipped", errorCode: "payload_unavailable" }; }
        if (!result) {
            try { result = await sender(event.eventName, payload.phone, payload.payload); }
            catch { result = { status: "unknown", errorCode: "unconfirmed_delivery" }; }
        }
        const status = result?.status === "accepted" ? "accepted" : ["rejected", "skipped"].includes(result?.status) ? "blocked" : "unknown";
        await Outbox.updateOne({ _id: event._id, status: "processing", attempts: event.attempts }, { $set: { status, provider: result?.provider, messageId: result?.messageId, errorCode: result?.errorCode || (status === "unknown" ? "unconfirmed_delivery" : undefined) }, $unset: { leaseUntil: "" } });
    }
}

export async function manageNotification(id, actor, data) {
    const { Outbox } = businessModels();
    if (actor.role !== "admin") throw new ErrorResponse("Not authorized", 403);
    if (typeof data.reason !== "string" || !data.reason.trim() || data.reason.length > 1000) throw new ErrorResponse("A recovery reason is required", 400);
    let filter, status;
    if (data.action === "retry") { filter = { status: "blocked" }; status = "pending"; }
    else if (data.action === "confirm_accepted" || data.action === "confirm_not_sent") {
        if (typeof data.reference !== "string" || !data.reference.trim() || data.reference.length > 200) throw new ErrorResponse("Provider confirmation reference is required", 400);
        filter = { status: "unknown" }; status = data.action === "confirm_accepted" ? "accepted" : "blocked";
    } else throw new ErrorResponse("Invalid recovery action", 400);
    const event = await Outbox.findOneAndUpdate({ _id: id, ...filter }, { $set: { status, errorCode: null }, $push: { history: { actor: actor._id, action: data.action, reason: data.reason.trim(), reference: data.reference?.trim(), at: new Date() } } }, { returnDocument: "after" });
    if (!event) throw new ErrorResponse("Notification state changed or action is unsafe. Refresh first", 409);
    return event;
}

export function startNotificationWorker() {
    if (process.env.NOTIFICATION_WORKER === "off") return () => {};
    let busy = false;
    const timer = setInterval(async () => {
        if (busy) return;
        busy = true;
        try { await processNotificationOutbox(); } catch { console.error("Notification worker needs attention"); }
        finally { busy = false; }
    }, 5000);
    timer.unref();
    return () => clearInterval(timer);
}
