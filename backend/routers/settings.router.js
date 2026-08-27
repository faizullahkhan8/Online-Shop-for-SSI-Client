import { Router } from "express";
import { isAuth, authorize } from "../middlewares/auth.middleware.js";
import {
    getSettings,
    updateSettings,
} from "../controllers/settings.controller.js";

const router = new Router();

router.get("/", getSettings);
router.put("/", isAuth, authorize("admin"), updateSettings);

export default router;
