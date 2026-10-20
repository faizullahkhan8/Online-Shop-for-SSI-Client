import { uploadImageBatch } from "../services/imageUploads.js";
import { safeError } from "../utils/safeLog.js";
import { normalizeImage } from "../utils/safeImage.js";
import { safeContentTree } from "../utils/safeHtml.js";
import { consumeLimit } from "./securityLimits.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import multer from "multer";
import imagekit from "../config/imagekit.js";
import FormData from "form-data";
import fetch from "node-fetch";

const rawUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 5, fields: 100, fieldSize: 1024 * 1024, parts: 110 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
            return cb(new ErrorResponse("Only JPEG, PNG and WebP images are allowed", 400));
        }
        cb(null, true);
    },
});

const guardedUpload = parser => async (req, res, next) => {
    try {
        await consumeLimit("upload", req.user?._id?.toString() || req.ip, 30, 900000);
        parser(req, res, async error => {
            if (error) return next(new ErrorResponse(error.code?.startsWith("LIMIT_") ? "Upload limit exceeded" : "Invalid upload", 400));
            try {
                if (req.file) req.file = await normalizeImage(req.file);
                if (Array.isArray(req.files)) {
                    const normalized = [];
                    for (const file of req.files) normalized.push(await normalizeImage(file));
                    req.files = normalized;
                }
                if (req.body?.data) req.body.data = JSON.stringify(safeContentTree(JSON.parse(req.body.data)));
                req.body = safeContentTree(req.body);
                next();
            } catch (error) { next(error.statusCode ? error : new ErrorResponse("Invalid upload data", 400)); }
        });
    } catch (error) {
        if (error.retryAfter) res.set("Retry-After", String(error.retryAfter));
        next(error);
    }
};
export const upload = {
    single: name => guardedUpload(rawUpload.single(name)),
    array: (name, count) => guardedUpload(rawUpload.array(name, count)),
};

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

export const handleOptionalBackgroundRemoval = async (req, res, next) => {
    let isRemoveBg = false;

    // 1️⃣ Read remove flag safely
    try {
        if (req.body.data) {
            const parsed = JSON.parse(req.body.data);
            isRemoveBg =
                parsed.isRemoveBg === true || parsed.isRemoveBg === "true";
        } else {
            isRemoveBg =
                req.body.isRemoveBg === "true" || req.body.isRemoveBg === true;
        }
    } catch {
        isRemoveBg = false;
    }

    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0 || !isRemoveBg) return next();

    try {
        await Promise.all(
            files.map(async (file) => {
                const formData = new FormData();
                formData.append("image_file", file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype,
                });
                formData.append("size", "auto");

                const response = await fetch("https://api.remove.bg/v1.0/removebg", {
                    method: "POST",
                    signal: AbortSignal.timeout(10000),
                    headers: {
                        "X-Api-Key": process.env.REMOVE_BG_API_KEY,
                        ...formData.getHeaders(),
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`remove.bg failed (${response.status})`);
                }

                const buffer = Buffer.from(await response.arrayBuffer());

                // Overwrite original image
                Object.assign(file, await normalizeImage({ ...file, buffer, mimetype: "image/png" }));
            })
        );
        console.log("✅ Background removed successfully for all images");
        next();
    } catch (err) {
        safeError("❌ Background removal failed:", err);
        next(new ErrorResponse("Background removal failed. Please retry or disable background removal.", 503));
    }
};

export const imagekitUpload = async (req, res, next) => {
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) {
        return next();
    }

    try {
        const results = await uploadImageBatch(files, imagekit.files);

        req.uploadedImages = results.map((result) => ({
            fileId: result.fileId,
            url: result.url,
            name: result.name,
            filePath: result.filePath,
        }));

        // Backward compatibility for routes that use single image
        if (req.file) {
            req.image = req.uploadedImages[0];
        }

        next();
    } catch (err) {
        safeError("❌ ImageKit upload failed:", err);
        return res.status(503).json({
            success: false, message: "Image upload failed. Please retry.",
        });
    }
};
