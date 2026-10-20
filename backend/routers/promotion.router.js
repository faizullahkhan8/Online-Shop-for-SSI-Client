import express from "express";
import { isAuth, authorize } from "../middlewares/auth.middleware.js";
import {
    addPromotion,
    getActiveDeals,
    getAllPromotions,
    getPromotionById,
    updatePromotion,
    deletePromotion,
} from "../controllers/promotion.controller.js";

const router = express.Router();

router.get("/active", getActiveDeals);
router.use(isAuth, authorize("admin"));
router.post("/", addPromotion);
router.get("/", getAllPromotions);
router.get("/:id", getPromotionById);
router.put("/:id", updatePromotion);
router.delete("/:id", deletePromotion);

export default router;
