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

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const registerUser = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();

    if (!UserModel) {
        return next(new ErrorResponse("User model not initiated.", 404));
    }

    const { name, email, phone, password } = req.body;

    if (!name || !email || !password || !phone) {
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
            phoneVerificationOtp: otp,
            phoneVerificationExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
        });
    } catch (error) {
        console.error("CREATE USER ERROR:", error);
        return next(error);
    }

    // Send OTP SMS
    await sendSMS("REGISTRATION_OTP", phone, { otp });

    return res.status(201).json({
        success: true,
        message: "OTP sent to phone for verification",
        userId: user._id,
    });
});

export const verifyPhone = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();
    const { userId, otp } = req.body;

    if (!userId || !otp) return next(new ErrorResponse("User ID and OTP are required", 400));

    const user = await UserModel.findById(userId);
    if (!user) return next(new ErrorResponse("User not found", 404));

    if (user.isPhoneVerified) return next(new ErrorResponse("Phone already verified", 400));

    if (user.phoneVerificationOtp !== otp) {
        return next(new ErrorResponse("Invalid OTP", 400));
    }

    if (new Date() > new Date(user.phoneVerificationExpires)) {
        return next(new ErrorResponse("OTP expired", 400));
    }

    user.isPhoneVerified = true;
    user.phoneVerificationOtp = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save({ validateModifiedOnly: true });

    const refreshToken = generateToken(user, "7d", process.env.JWT_REFRESH_SECRET);
    const accessToken = generateToken(user, "1d", process.env.JWT_ACCESS_SECRET);

    setCookie(res, refreshToken, 1000 * 60 * 60 * 24 * 7, "refreshToken");
    setCookie(res, accessToken, 1000 * 60 * 60 * 24, "accessToken");

    return res.status(200).json({
        success: true,
        message: "Phone verified successfully and logged in",
        user: user,
    });
});

export const loginUser = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();

    if (!UserModel) {
        return next(new ErrorResponse("User model not initiated.", 404));
    }

    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
        return next(new ErrorResponse("Email/Phone and password are required", 400));
    }

    const query = email ? { email } : { phone };
    const user = await UserModel.findOne(query);

    if (!user) {
        return next(new ErrorResponse("Invalid credentials", 400));
    }

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
        return next(new ErrorResponse("Invalid credentials", 400));
    }

    if (user.role === 'user' && !user.isPhoneVerified) {
        return next(new ErrorResponse("Please verify your phone number first", 403));
    }

    const refreshToken = generateToken(
        user,
        "7d",
        process.env.JWT_REFRESH_SECRET,
    );
    const accessToken = generateToken(
        user,
        "1d",
        process.env.JWT_ACCESS_SECRET,
    );

    setCookie(res, refreshToken, 1000 * 60 * 60 * 24 * 7, "refreshToken");
    setCookie(res, accessToken, 1000 * 60 * 60 * 24, "accessToken");

    return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        user: user,
    });
});

export const logoutUser = asyncHandler(async (req, res, next) => {
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");

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

    if (Array.isArray(addresses) && addresses.length > 0) {
        const nextAddress = addresses[0] || {};
        user.addresses = [
            {
                street: nextAddress.street || "",
                addressLine2: nextAddress.addressLine2 || "",
                city: nextAddress.city || "",
                state: nextAddress.state || "",
                postalCode: nextAddress.postalCode || "",
                country: nextAddress.country || "",
            },
        ];
    }

    if (req.image?.fileId) {
        if (user.avatarFileId) {
            try {
                await deleteImageKitFile(user.avatarFileId);
            } catch (err) {
                console.error("Failed to delete old avatar from ImageKit:", err);
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

    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (!decoded) {
        return next(new ErrorResponse("Session expired. Login again", 401));
    }

    const user = await UserModel.findById(decoded.id);

    if (!user) {
        return next(new ErrorResponse("User not found", 404));
    }

    const accessToken = generateToken(
        user,
        "1d",
        process.env.JWT_ACCESS_SECRET,
    );

    if (!accessToken) {
        return next(new ErrorResponse("Access token not generated", 400));
    }

    setCookie(res, accessToken, 1000 * 60 * 60 * 24, "accessToken");

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

    let wishlistDoc = await WishlistModel.findOne({ userId: req.user._id });

    if (!wishlistDoc) {
        wishlistDoc = await WishlistModel.create({
            userId: req.user._id,
            items: [{ product: productId }],
        });
        // attach wishlist ref to user document
        const user = await UserModel.findById(req.user._id);
        if (user) {
            user.wishlist = wishlistDoc._id;
            await user.save({ validateModifiedOnly: true });
        }
    } else {
        const exists = wishlistDoc.items.find(
            (i) => i.product.toString() === productId.toString(),
        );
        if (!exists) {
            wishlistDoc.items.push({ product: productId });
            await wishlistDoc.save({ validateModifiedOnly: true });
        }
    }

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

    const wishlistDoc = await WishlistModel.findOne({ userId: req.user._id });

    if (!wishlistDoc)
        return res.status(200).json({
            success: true,
            message: "Wishlist fetched successfully",
            wishlist: [],
        });

    wishlistDoc.items = wishlistDoc.items.filter(
        (i) => i.product.toString() !== productId.toString(),
    );
    await wishlistDoc.save({ validateModifiedOnly: true });

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
