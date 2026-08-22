import express from "express";
import multer from "multer";
import {
    getAllVendors,
    createVendor,
    updateVendor,
    deleteVendor,
    uploadVendorImage,
    deleteVendorImage,
} from "../controllers/vendor.controller.js";
import { isAuth, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router
    .route("/")
    .get(getAllVendors)
    .post(isAuth, authorize(["admin"]), createVendor); // removed upload.single because image will be uploaded separately

router.post("/upload-image", isAuth, authorize(["admin"]), upload.single("image"), uploadVendorImage);
router.delete("/delete-image/:fileId", isAuth, authorize(["admin"]), deleteVendorImage);

router
    .route("/:id")
    .put(isAuth, authorize(["admin"]), updateVendor)
    .delete(isAuth, authorize(["admin"]), deleteVendor);

export default router;
