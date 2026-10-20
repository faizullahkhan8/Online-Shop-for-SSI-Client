import crypto from "node:crypto";
import { ErrorResponse } from "./ErrorResponse.js";

function encryptionKey(name = "ENCRYPTION_KEY") {
    const value = process.env[name];
    if (!value || Buffer.byteLength(value, "utf8") !== 32) {
        throw new ErrorResponse(`${name} must be configured with exactly 32 UTF-8 bytes.`, 503);
    }
    return Buffer.from(value, "utf8");
}

export function encrypt(text) {
    if (!text) return text;
    const key = encryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    return ["v2", iv.toString("hex"), cipher.getAuthTag().toString("hex"), encrypted.toString("hex")].join(":");
}

export function decrypt(text) {
    if (!text) return text;
    // Legacy CBC values require an explicit key, never a source-code fallback.
    const modern = text.startsWith("v2:");
    const key = encryptionKey(!modern && process.env.LEGACY_ENCRYPTION_KEY ? "LEGACY_ENCRYPTION_KEY" : "ENCRYPTION_KEY");
    try {
        const parts = text.split(":");
        if (modern) {
            if (parts.length !== 4 || !/^[a-f0-9]{24}$/i.test(parts[1]) || !/^[a-f0-9]{32}$/i.test(parts[2]) || !/^(?:[a-f0-9]{2})+$/i.test(parts[3])) return null;
            const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(parts[1], "hex"));
            decipher.setAuthTag(Buffer.from(parts[2], "hex"));
            return Buffer.concat([decipher.update(Buffer.from(parts[3], "hex")), decipher.final()]).toString("utf8");
        }
        if (parts.length !== 2 || !/^[a-f0-9]{32}$/i.test(parts[0]) || !/^(?:[a-f0-9]{32})+$/i.test(parts[1])) return null;
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.from(parts[0], "hex"));
        return Buffer.concat([decipher.update(Buffer.from(parts[1], "hex")), decipher.final()]).toString("utf8");
    } catch {
        return null;
    }
}
