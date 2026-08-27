import { Router } from "express";
import { authorize, isAuth } from "../middlewares/auth.middleware.js";
import {
    getAllOrder,
    placeOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
    getDashboardStats,
    cancelOrder,
    cancelOrderItem,
    getUnreadOrdersCount,
    markOrderViewed,
} from "../controllers/order.controller.js";

const router = new Router();

router.post("/place-order", isAuth, placeOrder);
router.get("/get-all", isAuth, authorize("admin"), getAllOrder);

// Dashboard stats (admin only) - must be above /:id
router.get("/dashboard-stats", isAuth, authorize("admin"), getDashboardStats);
router.get("/unread-count", isAuth, authorize("admin"), getUnreadOrdersCount);
router.patch("/:id/mark-viewed", isAuth, authorize("admin"), markOrderViewed);

router.get("/my-orders", isAuth, getUserOrders);
router.get("/:id", isAuth, getOrderById);
router.patch("/update/:id", isAuth, authorize("admin"), updateOrderStatus);
router.patch("/payment/:id", isAuth, authorize("admin"), updatePaymentStatus);
router.delete("/delete/:id", isAuth, authorize("admin"), deleteOrder);

// Cancellation routes
router.put("/:id/cancel", isAuth, cancelOrder);
router.put(
    "/:id/items/:itemId/cancel",
    isAuth,
    authorize("admin"),
    cancelOrderItem,
);

export default router;
