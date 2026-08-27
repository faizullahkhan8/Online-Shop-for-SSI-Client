import express from "express";
import { isAuth, authorize } from "../middlewares/auth.middleware.js";
import {
    getMenus,
    createMenu,
    updateMenu,
    deleteMenu,
} from "../controllers/menu.controller.js";

const router = express.Router();

router
    .route("/")
    .get(getMenus)
    .post(isAuth, authorize("admin"), createMenu);

router
    .route("/:id")
    .put(isAuth, authorize("admin"), updateMenu)
    .delete(isAuth, authorize("admin"), deleteMenu);

export default router;
