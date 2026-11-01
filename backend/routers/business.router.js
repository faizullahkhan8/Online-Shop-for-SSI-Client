import { Router } from "express";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import asyncHandler from "express-async-handler";
import { isAuth, authorize } from "../middlewares/auth.middleware.js";
import { businessModels, prepareBusinessRecords } from "../services/businessRecords.js";
import { manageNotification } from "../services/notificationOutbox.js";
const router = Router();
router.use(isAuth, authorize("admin"));
router.param("id", (req, res, next, id) => /^[a-f0-9]{24}$/i.test(id) ? next() : next(new ErrorResponse("Invalid record ID", 400)));
router.get("/notifications", asyncHandler(async (req, res) => {
    await prepareBusinessRecords();
    const filter = ["pending", "processing", "accepted", "blocked", "unknown"].includes(req.query.status) ? { status: req.query.status } : {};
    const page = Number(req.query.page || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw new ErrorResponse("Invalid page", 400);
    const events = await businessModels().Outbox.find(filter).sort({ createdAt: -1 }).skip((page - 1) * 25).limit(25);
    res.json({ success: true, events, page });
}));
router.post("/notifications/:id/recovery", asyncHandler(async (req, res) => res.json({ success: true, event: await manageNotification(req.params.id, req.user, req.body) })));
router.get("/products/:id/movements", asyncHandler(async (req, res) => {
    await prepareBusinessRecords();
    res.json({ success: true, movements: await businessModels().Movement.find({ product: req.params.id }).sort({ createdAt: -1 }).limit(100) });
}));
router.get("/:aggregate/:id/history", asyncHandler(async (req, res) => {
    await prepareBusinessRecords();
    res.json({ success: true, events: await businessModels().Event.find({ aggregate: req.params.aggregate, recordId: req.params.id }).sort({ createdAt: -1 }).limit(100) });
}));
export default router;
