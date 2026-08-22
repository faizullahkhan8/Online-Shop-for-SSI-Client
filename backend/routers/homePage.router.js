import express from "express";
import { isAuth, authorize } from "../middlewares/auth.middleware.js";
import {
    getHomePage,
    updateHomePage,
    resetHomePage,
} from "../controllers/homePage.controller.js";

import { upload, imagekitUpload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.route("/").get(getHomePage).put(isAuth, authorize("admin"), updateHomePage);
router.route("/reset").delete(isAuth, authorize("admin"), resetHomePage);

import { deleteImageKitFile } from "../utils/DeleteFileImageKit.js";

router.post("/upload-image", isAuth, authorize("admin"), upload.single("image"), imagekitUpload, (req, res) => {
    if (!req.image) return res.status(400).json({ success: false, message: "No image uploaded" });
    res.json({ success: true, url: req.image.filePath, fileId: req.image.fileId });
});

router.delete("/delete-image/:fileId", isAuth, authorize("admin"), async (req, res) => {
    try {
        await deleteImageKitFile(req.params.fileId);
        res.json({ success: true, message: "Image deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete image" });
    }
});

export default router;
