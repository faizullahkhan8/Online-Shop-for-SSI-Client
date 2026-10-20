import express from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    getUser,
    updateUser,
    getAccessToken,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    getAllUsers,
    addUserFromAdmin,
    verifyPhone,
    resendOTP,
} from "../controllers/user.controller.js";
import { isAuth, authorize, authorizeUserAccess } from "../middlewares/auth.middleware.js";
import { upload, imagekitUpload } from "../middlewares/multer.middleware.js";
import { authLimit } from "../middlewares/securityLimits.js";

const router = express.Router();

router.post("/register", authLimit("register", 5, 3600000, 20), registerUser);
router.post("/verify-phone", authLimit("verify", 10, 600000), verifyPhone);
router.post("/resend-otp", authLimit("resend", 5, 3600000, 30), resendOTP);
router.post("/login", authLimit("login", 10, 900000), loginUser);
router.post("/logout", isAuth, logoutUser);
router.get("/get/:id", isAuth, authorizeUserAccess, getUser);
router.put(
    "/update/:id",
    isAuth,
    authorizeUserAccess,
    upload.single("avatar"),
    imagekitUpload,
    updateUser,
);
router.get("/getAccessToken", getAccessToken);

// Admin: get all users
router.get("/all", isAuth, authorize(["admin"]), getAllUsers);
router.post("/add", isAuth, authorize(["admin"]), addUserFromAdmin);

// Wishlist routes
router.get("/wishlist", isAuth, getWishlist);
router.post("/wishlist/add", isAuth, addToWishlist);
router.delete("/wishlist/remove/:productId", isAuth, removeFromWishlist);

export default router;
