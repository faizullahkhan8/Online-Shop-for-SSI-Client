import { Router } from "express";
import { isAuth, authorize } from "../middlewares/auth.middleware.js";
import {
    getSettings,
    getAdminSettings,
    updateSettings,
    testSmsSettings,
    getSmsAttempts,
} from "../controllers/settings.controller.js";

const router = new Router();

router.get("/", getSettings);
router.get("/admin", isAuth, authorize("admin"), getAdminSettings);
router.post("/sms/test", isAuth, authorize("admin"), testSmsSettings);
router.get("/sms/attempts", isAuth, authorize("admin"), getSmsAttempts);
router.put("/", isAuth, authorize("admin"), updateSettings);

export default router;
