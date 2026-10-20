import { safeError } from "../utils/safeLog.js";
import asyncHandler from "express-async-handler";
import {
    getLocalUserModel,
    getLocalWishlistModel,
    getLocalProductModel,
} from "../config/localDb.js";
import { generateToken, setCookie, verifyToken } from "../utils/jwt.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { deleteImageKitFile } from "../utils/DeleteFileImageKit.js";
import { sendSMS } from "../utils/smsService.js";
import { disconnectUserSockets } from "../config/socket.js";

import { profileAddresses } from "../utils/profileAddresses.js";

import { generateOTP, hashOTP, matchesOTP } from "../utils/otp.js";

export const registerUser = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();

    if (!UserModel) {
        return next(new ErrorResponse("User model not initiated.", 404));
    }

    const { name, email, phone, password } = req.body;

    if ([name, email, password, phone].some(value => typeof value !== "string" || !value.trim()) || password.length > 128) {
        return next(new ErrorResponse("All fields are required including phone", 400));
    }

    const isEmailExists = await UserModel.findOne({ email });
    if (isEmailExists) return next(new ErrorResponse("Email already exists", 400));

    const isPhoneExists = await UserModel.findOne({ phone });
    if (isPhoneExists) return next(new ErrorResponse("Phone number already exists", 400));

    const otp = generateOTP();
    let user;

    try {
        user = await UserModel.create({
            name,
            email,
            password,
            phone,
            isPhoneVerified: false,
            phoneVerificationOtp: hashOTP(otp),
            phoneVerificationLastSentAt: new Date(),
            phoneVerificationExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
        });
    } catch (error) {
        safeError("CREATE USER ERROR:", error);
        return next(error);
    }

    // Send OTP SMS
    const smsSent = await sendSMS("REGISTRATION_OTP", phone, { otp });

    return res.status(201).json({
        success: true,
        smsSent,
        verificationRequired: true,
        message: smsSent ? "OTP sent to phone for verification" : "Account created, but the verification SMS could not be sent. Please retry sending the code.",
        userId: user._id,
    });
});

export const resendOTP = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();
    const { userId } = req.body;
    if (typeof userId !== "string" || !/^[a-f0-9]{24}$/i.test(userId)) return next(new ErrorResponse("Invalid user ID", 400));
    const user = await UserModel.findOneAndUpdate({ _id: userId, isPhoneVerified: false,
        $or: [{ phoneVerificationLastSentAt: { $exists: false } }, { phoneVerificationLastSentAt: { $lte: new Date(Date.now() - 60000) } }] },
        { $set: { phoneVerificationLastSentAt: new Date() } }, { returnDocument: "after" })
        .select("+phoneVerificationOtp +phoneVerificationExpires");
    if (!user) {
        res.set("Retry-After", "60");
        return next(new ErrorResponse("Wait one minute before requesting another code, or check whether this account is already verified.", 429));
    }
    const otp = generateOTP();
    const smsSent = await sendSMS("REGISTRATION_OTP", user.phone, { otp });
    if (!smsSent) return res.status(503).json({ success: false, smsSent: false, verificationRequired: true, userId,
        message: "Verification SMS could not be sent. Your previous code remains valid until its expiry." });
    const updated = await UserModel.updateOne({ _id: userId, isPhoneVerified: false, phoneVerificationOtp: user.phoneVerificationOtp },
        { $set: { phoneVerificationOtp: hashOTP(otp), phoneVerificationExpires: new Date(Date.now() + 600000), phoneVerificationAttempts: 0 } });
    if (!updated.modifiedCount) return next(new ErrorResponse("Verification state changed. Please log in or request a new code.", 409));
    return res.json({ success: true, smsSent: true, message: "OTP resent successfully" });
});

export const verifyPhone = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();
    const { userId, otp } = req.body;
    if (typeof userId !== "string" || !/^[a-f0-9]{24}$/i.test(userId) || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
        return next(new ErrorResponse("A valid user ID and six-digit OTP are required", 400));
    }
    const user = await UserModel.findOneAndUpdate({ _id: userId, isPhoneVerified: false,
        phoneVerificationExpires: { $gt: new Date() },
        $or: [{ phoneVerificationAttempts: { $lt: 5 } }, { phoneVerificationAttempts: { $exists: false } }] },
        { $inc: { phoneVerificationAttempts: 1 } }, { returnDocument: "after" })
        .select("+phoneVerificationOtp +phoneVerificationExpires");
    if (!user) return next(new ErrorResponse("Code expired, already used, or attempt limit reached. Request a new code.", 400));
    if (!matchesOTP(otp, user.phoneVerificationOtp)) return next(new ErrorResponse("Invalid OTP", 400));
    const verified = await UserModel.findOneAndUpdate({ _id: userId, isPhoneVerified: false, phoneVerificationOtp: user.phoneVerificationOtp },
        { $set: { isPhoneVerified: true }, $unset: { phoneVerificationOtp: 1, phoneVerificationExpires: 1, phoneVerificationAttempts: 1 } },
        { returnDocument: "after" });
    if (!verified) return next(new ErrorResponse("Code already used or replaced", 409));
    const refreshToken = generateToken(verified, "7d", process.env.JWT_REFRESH_SECRET);
    const accessToken = generateToken(verified, "15m", process.env.JWT_ACCESS_SECRET);
    setCookie(res, refreshToken, 7 * 86400000, "refreshToken");
    setCookie(res, accessToken, 900000, "accessToken");
    return res.json({ success: true, message: "Phone verified successfully and logged in", user: verified });
});

export const loginUser = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();

    if (!UserModel) {
        return next(new ErrorResponse("User model not initiated.", 404));
    }

    const { email, phone, password } = req.body;

    if ((email !== undefined && typeof email !== "string") || (phone !== undefined && typeof phone !== "string") || (!email && !phone) || typeof password !== "string" || !password || password.length > 128) {
        return next(new ErrorResponse("Email/Phone and password are required", 400));
    }

    const query = email ? { email: email.trim().toLowerCase() } : { phone: phone.trim() };
    const user = await UserModel.findOne(query).select("+password");

    if (!user) {
        return next(new ErrorResponse("Invalid credentials", 400));
    }

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
        return next(new ErrorResponse("Invalid credentials", 400));
    }

    if (user.role === 'user' && !user.isPhoneVerified) {
        return res.status(403).json({
            success: false,
            message: "Please verify your phone number first",
            userId: user._id,
        });
    }

    const refreshToken = generateToken(
        user,
        "7d",
        process.env.JWT_REFRESH_SECRET,
    );
    const accessToken = generateToken(
        user,
        "15m",
        process.env.JWT_ACCESS_SECRET,
    );

    setCookie(res, refreshToken, 1000 * 60 * 60 * 24 * 7, "refreshToken");
    setCookie(res, accessToken, 900000, "accessToken");

    return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        user: user,
    });
});

export const logoutUser = asyncHandler(async (req, res, next) => {
    await getLocalUserModel().updateOne({ _id: req.user._id }, { $inc: { sessionVersion: 1 } });
    disconnectUserSockets(req.user._id);
    res.clearCookie("refreshToken", { path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" });
    res.clearCookie("accessToken", { path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" });

    return res.status(200).json({
        success: true,
        message: "User logged out successfully",
    });
});

export const getUser = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();

    if (!UserModel) {
        return next(new ErrorResponse("User model not initiated.", 404));
    }

    const user = await UserModel.findById(req.params.id);

    if (!user) {
        return next(new ErrorResponse("User not found", 404));
    }

    return res.status(200).json({
        success: true,
        message: "User fetched successfully",
        user: user,
    });
});

export const updateUser = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();

    if (!UserModel) {
        return next(new ErrorResponse("User model not initiated.", 404));
    }

    const userId = req.params.id;
    let updateData = req.body;

    if (req.body.data) {
        try {
            updateData = JSON.parse(req.body.data);
        } catch (error) {
            return next(new ErrorResponse("Invalid data format", 400));
        }
    }

    const { name, phone, address, addresses } = updateData;

    const user = await UserModel.findById(userId);

    if (!user) {
        return next(new ErrorResponse("User not found", 404));
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    if (address) {
        user.addresses = [
            {
                street: address,
            },
        ];
    }

    if (addresses !== undefined) {
        try { user.addresses = profileAddresses(addresses); }
        catch (error) { return next(new ErrorResponse(error.message, 400)); }
    }

    if (req.image?.fileId) {
        if (user.avatarFileId) {
            try {
                await deleteImageKitFile(user.avatarFileId);
            } catch (err) {
                safeError("Failed to delete old avatar from ImageKit:", err);
            }
        }
        user.avatar = req.image.url;
        user.avatarFileId = req.image.fileId;
    }

    const updatedUser = await user.save({ validateModifiedOnly: true });

    return res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: updatedUser,
    });
});

export const getAllUsers = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();

    if (!UserModel)
        return next(new ErrorResponse("User model not initiated.", 404));

    const users = await UserModel.find({}).select("-password");

    return res
        .status(200)
        .json({ success: true, message: "Users fetched", users });
});

export const getAccessToken = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();

    if (!UserModel) {
        return next(new ErrorResponse("User model not initiated.", 404));
    }

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return next(new ErrorResponse("Session expired. Login again", 401));
    }

    let decoded;
    try { decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET); }
    catch { return next(new ErrorResponse("Session expired. Login again", 401)); }

    if (!decoded) {
        return next(new ErrorResponse("Session expired. Login again", 401));
    }

    const user = await UserModel.findById(decoded.id);

    if (!user || decoded.version !== (user.sessionVersion || 0)) {
        return next(new ErrorResponse("Session expired. Login again", 401));
    }

    const accessToken = generateToken(
        user,
        "15m",
        process.env.JWT_ACCESS_SECRET,
    );

    if (!accessToken) {
        return next(new ErrorResponse("Access token not generated", 400));
    }

    setCookie(res, accessToken, 900000, "accessToken");

    return res.status(200).json({
        success: true,
        message: "Access token generated successfully",
    });
});

export const getWishlist = asyncHandler(async (req, res, next) => {
    const WishlistModel = getLocalWishlistModel();

    if (!WishlistModel)
        return next(new ErrorResponse("Wishlist model not initiated.", 404));

    const wishlistDoc = await WishlistModel.findOne({
        userId: req.user._id,
    }).populate({ path: "items.product", model: "Product" });

    if (!wishlistDoc) {
        return res.status(200).json({
            success: true,
            message: "Wishlist fetched successfully",
            wishlist: [],
        });
    }

    const products = wishlistDoc.items.map((i) => i.product).filter(Boolean);

    return res.status(200).json({
        success: true,
        message: "Wishlist fetched successfully",
        wishlist: products,
    });
});

export const addToWishlist = asyncHandler(async (req, res, next) => {
    const WishlistModel = getLocalWishlistModel();
    const ProductModel = getLocalProductModel();
    const UserModel = getLocalUserModel();

    if (!WishlistModel)
        return next(new ErrorResponse("Wishlist model not initiated.", 404));

    const { productId } = req.body;

    if (!productId)
        return next(new ErrorResponse("Product id is required", 400));

    const product = await ProductModel.findById(productId);
    if (!product) return next(new ErrorResponse("Product not found", 404));

    await WishlistModel.init();
    try {
        await WishlistModel.updateOne({ userId: req.user._id }, { $setOnInsert: { userId: req.user._id, items: [] } }, { upsert: true });
    } catch (error) { if (error.code !== 11000) throw error; }
    await WishlistModel.updateOne({ userId: req.user._id, "items.product": { $ne: product._id } }, { $push: { items: { product: product._id } } });
    const wishlistDoc = await WishlistModel.findOne({ userId: req.user._id });
    await UserModel.updateOne({ _id: req.user._id }, { $set: { wishlist: wishlistDoc._id } });

    await wishlistDoc.populate({ path: "items.product", model: "Product" });

    const products = wishlistDoc.items.map((i) => i.product).filter(Boolean);

    return res.status(200).json({
        success: true,
        message: "Product added to wishlist",
        wishlist: products,
    });
});

export const removeFromWishlist = asyncHandler(async (req, res, next) => {
    const WishlistModel = getLocalWishlistModel();

    if (!WishlistModel)
        return next(new ErrorResponse("Wishlist model not initiated.", 404));

    const { productId } = req.params;

    if (!/^[a-f0-9]{24}$/i.test(productId)) return next(new ErrorResponse("Invalid product ID", 400));
    const wishlistDoc = await WishlistModel.findOneAndUpdate({ userId: req.user._id },
        { $pull: { items: { product: productId } } }, { returnDocument: "after" });
    if (!wishlistDoc) return res.json({ success: true, wishlist: [] });

    await wishlistDoc.populate({ path: "items.product", model: "Product" });

    const products = wishlistDoc.items.map((i) => i.product).filter(Boolean);

    return res.status(200).json({
        success: true,
        message: "Product removed from wishlist",
        wishlist: products,
    });
});

export const addUserFromAdmin = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();

    if (!UserModel) {
        return next(new ErrorResponse("User model not initiated.", 404));
    }

    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
        return next(
            new ErrorResponse("Name, email, and password are required", 400),
        );
    }

    const isEmailExists = await UserModel.findOne({ email });

    if (isEmailExists) {
        return next(
            new ErrorResponse("Email already exists in the system", 400),
        );
    }

    const user = await UserModel.create({
        name,
        email,
        password,
        role: role || "user",
        phone: phone || "0000000000",
        isVerified: true,
    });

    res.status(201).json({
        success: true,
        message: "User created successfully by admin",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
        },
    });
});
