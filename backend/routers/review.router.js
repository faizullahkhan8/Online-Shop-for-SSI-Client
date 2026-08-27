import express from "express";
import { addReview, getProductReviews } from "../controllers/review.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/:productId", getProductReviews);
router.post("/", isAuth, addReview);

export default router;
