import { getLocalPrescriptionModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { prepareBusinessRecords, recordEvent } from "./businessRecords.js";
import { enqueueNotification } from "./notificationOutbox.js";

export async function changePrescription(id, actor, data) {
    if (actor.role !== "admin") throw new ErrorResponse("Not authorized", 403);
    const Model = getLocalPrescriptionModel();
    await prepareBusinessRecords();
    return Model.db.transaction(async session => {
        const prescription = await Model.findOne({ _id: id, isArchived: { $ne: true } }).session(session);
        if (!prescription) throw new ErrorResponse("Prescription not found", 404);
        const from = prescription.status;
        if (data.expectedStatus !== undefined && data.expectedStatus !== from) throw new ErrorResponse("Prescription changed. Refresh before deciding", 409);
        if (from === data.status) return { prescription, changed: false };
        if (!["pending", "processing", "completed", "rejected"].includes(data.status)) throw new ErrorResponse("Invalid status", 400);
        const reopen = ["completed", "rejected"].includes(from) && data.status === "pending" && data.action === "reopen";
        if (reopen && (typeof data.reason !== "string" || !data.reason.trim())) throw new ErrorResponse("A reopening reason is required", 400);
        if (!reopen && !({ pending: ["processing", "rejected"], processing: ["completed", "rejected"] }[from] || []).includes(data.status)) throw new ErrorResponse("Invalid prescription transition. Terminal decisions require explicit reopening", 409);
        const reason = typeof data.reason === "string" ? data.reason.trim().slice(0, 1000) : "";
        const action = reopen ? "reopened" : "status_changed";
        prescription.status = data.status;
        prescription.history.push({ action, from, to: data.status, actor: actor._id, reason, at: new Date() });
        await prescription.save({ session });
        const key = `prescription:${id}:${prescription.history.length}`;
        await recordEvent(session, { key, aggregate: "prescription", recordId: prescription._id, actor: actor._id, action, reason, details: { from, to: data.status } });
        await enqueueNotification(session, { key, sourceType: "prescription", sourceId: prescription._id, eventName: "PRESCRIPTION_UPDATE", phone: prescription.phone, payload: { name: prescription.name, status: data.status } });
        return { prescription, changed: true };
    });
}
