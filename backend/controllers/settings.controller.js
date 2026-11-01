import expressAsyncHandler from "express-async-handler";
import { getLocalSettingsModel, getLocalSmsAttemptModel } from "../config/localDb.js";
import { nonNegativeAmount } from "../utils/orderPricing.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { resolveSmsConfig, validateSmsDraft, normalizePhone, applySmsConfiguration, serializeSmsConfigurations } from "../services/sms/config.js";
import { smsProviderMetadata } from "../services/sms/registry.js";
import { sendTextSMS } from "../utils/smsService.js";

function serializeSettings(settings, admin = false) {
    const value = settings.toObject();
    const result = {
        taxAmount: value.taxAmount,
        shippingFee: value.shippingFee,
        shippingMethod: value.shippingMethod,
        advancedShipping: value.advancedShipping,
        paymentMethods: admin ? value.paymentMethods : (value.paymentMethods || [])
            .filter(method => method.isActive)
            .map(({ title, information, image, isActive }) => ({ title, information, image, isActive })),
    };
    if (admin) {
        result.smsGatewayUsername = value.smsGatewayUsername;
        result.smsGatewayPasswordConfigured = Boolean(value.smsGatewayPassword);
        result.smsProvider = value.smsProvider || "sms_gate";
        result.smsTwilioAccountSid = value.smsTwilioAccountSid || "";
        result.smsTwilioFrom = value.smsTwilioFrom || "";
        result.smsTwilioAuthTokenConfigured = Boolean(value.smsTwilioAuthToken);
        result.smsProviders = smsProviderMetadata();
        result.smsConfigurations = serializeSmsConfigurations(settings);
    }
    return result;
}

export const getSettings = expressAsyncHandler(async (req, res, next) => {
    const SettingsModel = getLocalSettingsModel();
    if (!SettingsModel) return next(new ErrorResponse("Model not found!", 400));

    let settings = await SettingsModel.findOne();
    if (!settings) {
        settings = new SettingsModel({
            taxAmount: 0,
            shippingFee: 0,
            shippingMethod: "standard",
        });
    }

    return res.status(200).json({
        success: true,
        message: "Settings fetched.",
        settings: serializeSettings(settings),
    });
});

export const getAdminSettings = expressAsyncHandler(async (req, res, next) => {
    const SettingsModel = getLocalSettingsModel();
    if (!SettingsModel) return next(new ErrorResponse("Model not found!", 400));
    const settings = await SettingsModel.findOne() || new SettingsModel();
    return res.status(200).json({ success: true, settings: serializeSettings(settings, true) });
});

export const updateSettings = expressAsyncHandler(async (req, res, next) => {
    const SettingsModel = getLocalSettingsModel();
    if (!SettingsModel) return next(new ErrorResponse("Model not found!", 400));

    const { taxAmount, shippingFee, shippingMethod, paymentMethods, advancedShipping } = req.body;
    validateSmsDraft(req.body);
    if (advancedShipping?.freeDeliveryEnabled !== undefined && typeof advancedShipping.freeDeliveryEnabled !== "boolean") {
        throw new ErrorResponse("Free-delivery enabled must be true or false", 400);
    }
    if (advancedShipping?.freeDeliveryRadiusKm !== undefined &&
        nonNegativeAmount(advancedShipping.freeDeliveryRadiusKm, "Free-delivery radius") < 0.01) {
        throw new ErrorResponse("Free-delivery radius must be at least 0.01 km", 400);
    }
    if (advancedShipping?.freeDeliveryEnabled === true) {
        const store = advancedShipping.storeLocation;
        const valid = (value, limit) => ["number", "string"].includes(typeof value) && value !== null && value !== undefined && value !== "" &&
            Number.isFinite(Number(value)) && Math.abs(Number(value)) <= limit;
        if (!valid(store?.lat, 90) || !valid(store?.lng, 180)) {
            throw new ErrorResponse("Set a valid store location for the free-delivery radius", 400);
        }
    }
    for (const field of ["taxAmount", "shippingFee"]) if (req.body[field] !== undefined) nonNegativeAmount(req.body[field], field);

    let settings = await SettingsModel.findOne();
    if (req.body.smsProvider && req.body.smsProvider !== (settings?.smsProvider || "sms_gate")) {
        // Do not switch live traffic to an unconfigured provider.
        resolveSmsConfig(settings, req.body);
    }
    if (!settings) {
        settings = new SettingsModel({
            taxAmount: Number(taxAmount) || 0,
            shippingFee: Number(shippingFee) || 0,
            shippingMethod: shippingMethod || "standard",
            paymentMethods: paymentMethods || [],
            advancedShipping: advancedShipping || undefined,
        });
    } else {
        if (taxAmount !== undefined) settings.taxAmount = Number(taxAmount);
        if (shippingFee !== undefined) settings.shippingFee = Number(shippingFee);
        settings.shippingMethod = shippingMethod || settings.shippingMethod;
        
        if (paymentMethods !== undefined) {
            settings.paymentMethods = paymentMethods;
        }
        if (advancedShipping !== undefined) {
            settings.advancedShipping = advancedShipping;
        }
    }
    applySmsConfiguration(settings, req.body);
    if (req.body.clearSmsTwilioAuthToken === true) settings.smsTwilioAuthToken = "";
    if (req.body.clearSmsGatewayPassword === true) settings.smsGatewayPassword = "";
    await settings.save({ validateModifiedOnly: true });

    return res.status(200).json({
        success: true,
        message: "Settings updated.",
        settings: serializeSettings(settings, true),
    });
});

export const testSmsSettings = expressAsyncHandler(async (req, res, next) => {
    const phone = normalizePhone(req.body.phone);
    if (!phone) return next(new ErrorResponse("Enter a valid test phone number with country code.", 400));
    const draft = req.body.configuration || {};
    validateSmsDraft(draft);
    const Settings = getLocalSettingsModel();
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    resolveSmsConfig(settings, draft);
    // Atomic cooldown shared across app instances. Test uses draft credentials without activation.
    const reserved = await Settings.findOneAndUpdate({ _id: settings._id,
        $or: [{ smsLastTestAt: { $exists: false } }, { smsLastTestAt: null }, { smsLastTestAt: { $lt: new Date(Date.now() - 60000) } }] },
        { $set: { smsLastTestAt: new Date() } });
    if (!reserved) {
        res.set("Retry-After", "60");
        return next(new ErrorResponse("Wait one minute before sending another test SMS.", 429));
    }
    const result = await sendTextSMS(phone, "Zada Pharmacy: this is a test SMS from your administrator.", { settings, draft });
    const accepted = result.status === "accepted";
    return res.status(accepted ? 200 : 503).json({ success: accepted, result,
        message: accepted ? "Provider accepted the test SMS. Check the recipient phone; delivery is not confirmed yet."
            : result.status === "unknown" ? "Delivery outcome is unknown. Check the provider before retrying to avoid duplicate SMS."
                : "Test SMS was not accepted. Check your provider configuration." });
});

export const getSmsAttempts = expressAsyncHandler(async (req, res) => {
    const attempts = await getLocalSmsAttemptModel().find().sort({ createdAt: -1 }).limit(20).lean();
    return res.json({ success: true, attempts });
});
