import { getLocalUserModel } from "../config/localDb.js";
import { generateToken, setCookie, verifyToken } from "../utils/jwt.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import expressAsyncHandler from "express-async-handler";

export const isAuth = expressAsyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();

    if (!UserModel) {
        return next(new ErrorResponse("User model not found", 404));
    }

    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    let accessDecode;
    let refreshDecode;

    if (accessToken) {
        try {
            accessDecode = verifyToken(
                accessToken,
                process.env.JWT_ACCESS_SECRET,
            );
        } catch (error) {
            accessDecode = null;
        }
    }

    if (refreshToken) {
        try {
            refreshDecode = verifyToken(
                refreshToken,
                process.env.JWT_REFRESH_SECRET,
            );
        } catch (error) {
            refreshDecode = null;
        }
    }

    const decode = accessDecode || refreshDecode;

    if (!decode) {
        return next(new ErrorResponse("Session Expired Login Again", 401));
    }

    const user = await UserModel.findById(decode.id);

    if (!user || decode.version !== (user.sessionVersion || 0)) {
        return next(new ErrorResponse("Session expired. Login again", 401));
    }

    if (!accessDecode && refreshDecode) {
        const newAcessToken = generateToken(
            user,
            "15m",
            process.env.JWT_ACCESS_SECRET,
        );

        setCookie(res, newAcessToken, 900000, "accessToken");
    }

    req.user = user;

    next();
});

export const optionalAuth = expressAsyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();

    if (!UserModel) {
        return next();
    }

    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    let accessDecode;
    let refreshDecode;

    if (accessToken) {
        try {
            accessDecode = verifyToken(accessToken, process.env.JWT_ACCESS_SECRET);
        } catch (error) {
            accessDecode = null;
        }
    }

    if (refreshToken) {
        try {
            refreshDecode = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            refreshDecode = null;
        }
    }

    const decode = accessDecode || refreshDecode;

    if (!decode) {
        return next();
    }

    const user = await UserModel.findById(decode.id);

    if (user && decode.version === (user.sessionVersion || 0)) {
        req.user = user;
    }

    next();
});

export const authorize = (role = []) =>
    expressAsyncHandler(async (req, res, next) => {
        const roles = Array.isArray(role) ? role : [role];
        if (!roles.includes(req.user?.role)) {
            return next(new ErrorResponse("Unauthorized", 401));
        }
        return next();
    });

export const authorizeUserAccess = (req, res, next) => {
    if (req.user?.role === "admin" || String(req.user?._id) === req.params.id) {
        return next();
    }
    return next(new ErrorResponse("Not authorized to access this account", 403));
};
