import express from "express";
import {
    addPromotion,
    getActiveDeals,
    getAllPromotions,
    getPromotionById,
    updatePromotion,
    deletePromotion,
} from "../controllers/promotion.controller.js";

const router = express.Router();

router.post("/", addPromotion);
router.get("/active", getActiveDeals);
router.get("/", getAllPromotions); // Admin
router.get("/:id", getPromotionById); // Admin/Edit
router.put("/:id", updatePromotion); // Admin
router.delete("/:id", deletePromotion); // Admin

export default router;
