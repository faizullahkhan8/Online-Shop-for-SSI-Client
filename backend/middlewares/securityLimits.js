import crypto from "node:crypto";
import { Schema } from "mongoose";
import { getLocalUserModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";

const limitSchema = new Schema({ _id: String, count: Number, expiresAt: { type: Date, expires: 0 } });
export async function consumeLimit(scope, subject, maximum, windowMs) {
    const connection = getLocalUserModel().db;
    const Model = connection.models.SecurityLimit || connection.model("SecurityLimit", limitSchema);
    const now = Date.now(), bucket = Math.floor(now / windowMs);
    const id = crypto.createHash("sha256").update(`${scope}:${subject}:${bucket}`).digest("hex");
    const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 1) * windowMs) } };
    let record;
    try { record = await Model.findByIdAndUpdate(id, update, { upsert: true, returnDocument: "after" }); }
    catch (error) {
        if (error.code !== 11000) throw error;
        record = await Model.findByIdAndUpdate(id, { $inc: { count: 1 } }, { returnDocument: "after" });
    }
    if (record.count > maximum) {
        const error = new ErrorResponse("Too many attempts. Please try again later.", 429);
        error.retryAfter = Math.ceil(((bucket + 1) * windowMs - now) / 1000);
        throw error;
    }
}

export const authLimit = (action, accountMax, windowMs, ipMax = 60) => async (req, res, next) => {
    try {
        await consumeLimit(`${action}:ip`, req.ip, ipMax, windowMs);
        const subject = req.body?.email || req.body?.phone || req.body?.userId;
        if (typeof subject === "string") await consumeLimit(`${action}:account`, subject.trim().toLowerCase(), accountMax, windowMs);
        next();
    } catch (error) {
        if (error.retryAfter) res.set("Retry-After", String(error.retryAfter));
        next(error);
    }
};
