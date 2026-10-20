import sharp from "sharp";
import crypto from "node:crypto";
import { ErrorResponse } from "./ErrorResponse.js";

export async function normalizeImage(file) {
    try {
        const image = sharp(file.buffer, { limitInputPixels: 16000000, failOn: "warning" });
        const meta = await image.metadata();
        const mime = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }[meta.format];
        if (!mime || mime !== file.mimetype || (meta.pages || 1) > 1) throw new Error("Invalid image");
        const buffer = await image.rotate().webp({ quality: 90 }).toBuffer();
        if (buffer.length > 5 * 1024 * 1024) throw new Error("Image too large");
        return { ...file, buffer, size: buffer.length, mimetype: "image/webp", originalname: `${crypto.randomUUID()}.webp` };
    } catch {
        throw new ErrorResponse("Upload a valid static JPEG, PNG or WebP image (maximum 5 MB and 16 megapixels).", 400);
    }
}
