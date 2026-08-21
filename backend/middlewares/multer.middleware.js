import multer from "multer";
import imagekit from "../config/imagekit.js";
import FormData from "form-data";
import fetch from "node-fetch";

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only images allowed"));
        }
        cb(null, true);
    },
});

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
                    headers: {
                        "X-Api-Key": process.env.REMOVE_BG_API_KEY,
                        ...formData.getHeaders(),
                    },
                    body: formData,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("remove.bg error:", errorText);
                    throw new Error(`remove.bg failed (${response.status})`);
                }

                const buffer = Buffer.from(await response.arrayBuffer());

                // Overwrite original image
                file.buffer = buffer;
                file.size = buffer.length;
                file.mimetype = "image/png"; // remove.bg always returns PNG
            })
        );
        console.log("✅ Background removed successfully for all images");
        next();
    } catch (err) {
        console.error("❌ Background removal failed:", err);
        next(); // fail-open
    }
};

export const imagekitUpload = async (req, res, next) => {
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) {
        return next();
    }

    try {
        const uploadPromises = files.map((file) =>
            imagekit.files.upload({
                file: file.buffer.toString("base64"),
                fileName: file.originalname,
                folder: "/products",
                useUniqueFileName: true,
            })
        );

        const results = await Promise.all(uploadPromises);

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
        console.error("❌ ImageKit upload failed:", err);
        return res.status(500).json({
            message: "Image upload failed",
            error: err.message,
        });
    }
};
