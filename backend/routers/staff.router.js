import express from "express";
import {
    getStaff,
    getTeamHero,
    updateTeamHero,
    createStaff,
    updateStaff,
    deleteStaff,
} from "../controllers/staff.controller.js";
import { isAuth, authorize } from "../middlewares/auth.middleware.js";
import { setLocalDB } from "../middlewares/db.middleware.js";
import { upload, imagekitUploadTo } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.use(setLocalDB);

router.route("/")
    .get(getStaff)
    .post(isAuth, authorize("admin", "manager"), upload.single("image"), imagekitUploadTo("/staff"), createStaff);

router.route("/hero")
    .get(getTeamHero)
    .put(isAuth, authorize("admin"), updateTeamHero);

router.route("/:id")
    .put(isAuth, authorize("admin", "manager"), upload.single("image"), imagekitUploadTo("/staff"), updateStaff)
    .delete(isAuth, authorize("admin", "manager"), deleteStaff);

export default router;
