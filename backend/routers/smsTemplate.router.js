import express from "express";
import { getSmsTemplates, seedSmsTemplates, updateSmsTemplate } from "../controllers/smsTemplate.controller.js";
import { isAuth, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/")
    .get(isAuth, authorize("admin"), getSmsTemplates);

router.route("/seed")
    .post(isAuth, authorize("admin"), seedSmsTemplates);

router.route("/:id")
    .put(isAuth, authorize("admin"), updateSmsTemplate);

export default router;
