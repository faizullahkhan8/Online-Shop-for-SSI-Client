import expressAsyncHandler from "express-async-handler";
import { getLocalSettingsModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";

export const getSettings = expressAsyncHandler(async (req, res, next) => {
    const SettingsModel = getLocalSettingsModel();
    if (!SettingsModel) return next(new ErrorResponse("Model not found!", 400));

    let settings = await SettingsModel.findOne();
    if (!settings) {
        settings = await SettingsModel.create({
            taxAmount: 0,
            shippingFee: 0,
            shippingMethod: "standard",
        });
    }

    return res.status(200).json({
        success: true,
        message: "Settings fetched.",
        settings,
    });
});

export const updateSettings = expressAsyncHandler(async (req, res, next) => {
    const SettingsModel = getLocalSettingsModel();
    if (!SettingsModel) return next(new ErrorResponse("Model not found!", 400));

    const { taxAmount, shippingFee, shippingMethod, paymentMethods, advancedShipping } = req.body;

    let settings = await SettingsModel.findOne();
    if (!settings) {
        settings = await SettingsModel.create({
            taxAmount: Number(taxAmount) || 0,
            shippingFee: Number(shippingFee) || 0,
            shippingMethod: shippingMethod || "standard",
            paymentMethods: paymentMethods || [],
            advancedShipping: advancedShipping || undefined,
        });
    } else {
        settings.taxAmount = Number(taxAmount) || 0;
        settings.shippingFee = Number(shippingFee) || 0;
        settings.shippingMethod = shippingMethod || settings.shippingMethod;
        if (paymentMethods !== undefined) {
            settings.paymentMethods = paymentMethods;
        }
        if (advancedShipping !== undefined) {
            settings.advancedShipping = advancedShipping;
        }
        await settings.save({ validateModifiedOnly: true });
    }

    return res.status(200).json({
        success: true,
        message: "Settings updated.",
        settings,
    });
});
