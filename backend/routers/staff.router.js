import express from "express";
import {
    getStaff,
    createStaff,
    updateStaff,
    deleteStaff,
} from "../controllers/staff.controller.js";
import { isAuth, authorize } from "../middlewares/auth.middleware.js";
import { setLocalDB } from "../middlewares/db.middleware.js";
import { upload, imagekitUpload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.use(setLocalDB);

router.route("/")
    .get(getStaff)
    .post(isAuth, authorize("admin", "manager"), upload.single("image"), imagekitUpload, createStaff);

router.route("/:id")
    .put(isAuth, authorize("admin", "manager"), upload.single("image"), imagekitUpload, updateStaff)
    .delete(isAuth, authorize("admin", "manager"), deleteStaff);

export default router;
