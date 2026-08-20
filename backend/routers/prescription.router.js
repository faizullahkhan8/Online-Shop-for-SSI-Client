import express from "express";
import { isAuth, authorize, optionalAuth } from "../middlewares/auth.middleware.js";
import { upload, imagekitUpload } from "../middlewares/multer.middleware.js";
import {
    uploadPrescription,
    getAllPrescriptions,
    getUserPrescriptions,
    updatePrescriptionStatus,
    deletePrescription,
} from "../controllers/prescription.controller.js";

const router = express.Router();

router
    .route("/")
    .post(optionalAuth, upload.single("image"), imagekitUpload, uploadPrescription)
    .get(isAuth, authorize("admin"), getAllPrescriptions);

router.route("/my").get(isAuth, getUserPrescriptions);

router
    .route("/:id/status")
    .put(isAuth, authorize("admin"), updatePrescriptionStatus);

router
    .route("/:id")
    .delete(isAuth, authorize("admin"), deletePrescription);

export default router;
