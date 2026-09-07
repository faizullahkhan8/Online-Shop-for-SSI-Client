import expressAsyncHandler from "express-async-handler";
import { getLocalSettingsModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { encrypt, decrypt } from "../utils/encryption.js";

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

    // Decrypt the password for the admin response
    const settingsResponse = settings.toObject();
    if (settingsResponse.smsGatewayPassword) {
        settingsResponse.smsGatewayPassword = decrypt(settingsResponse.smsGatewayPassword) || "";
    }

    return res.status(200).json({
        success: true,
        message: "Settings fetched.",
        settings: settingsResponse,
    });
});

export const updateSettings = expressAsyncHandler(async (req, res, next) => {
    const SettingsModel = getLocalSettingsModel();
    if (!SettingsModel) return next(new ErrorResponse("Model not found!", 400));

    const { taxAmount, shippingFee, shippingMethod, paymentMethods, advancedShipping, smsGatewayUsername, smsGatewayPassword } = req.body;

    let settings = await SettingsModel.findOne();
    if (!settings) {
        settings = await SettingsModel.create({
            taxAmount: Number(taxAmount) || 0,
            shippingFee: Number(shippingFee) || 0,
            shippingMethod: shippingMethod || "standard",
            paymentMethods: paymentMethods || [],
            advancedShipping: advancedShipping || undefined,
            smsGatewayUsername: smsGatewayUsername || "",
            smsGatewayPassword: smsGatewayPassword ? encrypt(smsGatewayPassword) : "",
        });
    } else {
        settings.taxAmount = Number(taxAmount) || 0;
        settings.shippingFee = Number(shippingFee) || 0;
        settings.shippingMethod = shippingMethod || settings.shippingMethod;
        
        if (smsGatewayUsername !== undefined) {
            settings.smsGatewayUsername = smsGatewayUsername;
        }
        
        if (smsGatewayPassword !== undefined) {
            settings.smsGatewayPassword = smsGatewayPassword ? encrypt(smsGatewayPassword) : "";
        }

        if (paymentMethods !== undefined) {
            settings.paymentMethods = paymentMethods;
        }
        if (advancedShipping !== undefined) {
            settings.advancedShipping = advancedShipping;
        }
        await settings.save({ validateModifiedOnly: true });
    }

    const settingsResponse = settings.toObject();
    if (settingsResponse.smsGatewayPassword) {
        settingsResponse.smsGatewayPassword = decrypt(settingsResponse.smsGatewayPassword) || "";
    }

    return res.status(200).json({
        success: true,
        message: "Settings updated.",
        settings: settingsResponse,
    });
});
