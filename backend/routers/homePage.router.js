import express from "express";
import { isAuth, authorize } from "../middlewares/auth.middleware.js";
import {
    getHomePage,
    updateHomePage,
    resetHomePage,
} from "../controllers/homePage.controller.js";

const router = express.Router();

router.route("/").get(getHomePage).put(isAuth, authorize("admin"), updateHomePage);
router.route("/reset").delete(isAuth, authorize("admin"), resetHomePage);

export default router;
