import { getLocalSmsTemplateModel, getLocalSettingsModel, getLocalSmsAttemptModel } from "../config/localDb.js";
import { resolveSmsConfig, normalizePhone } from "../services/sms/config.js";
import { sendWithProvider } from "../services/sms/providers.js";
import dotenv from "dotenv";

dotenv.config();

// Default templates just in case DB doesn't have them seeded yet
const DEFAULT_TEMPLATES = {
    "REGISTRATION_OTP": "Your verification OTP is {{otp}}. Please do not share this with anyone.",
    "LOGIN_OTP": "Your login OTP is {{otp}}. Please do not share this with anyone.",
    "PRESCRIPTION_UPLOADED": "Hi {{name}}, your prescription has been successfully uploaded and is pending review.",
    "PRESCRIPTION_UPDATE": "Hi {{name}}, the status of your prescription has been updated to: {{status}}.",
    "ORDER_PLACED": "Hi {{name}}, your order {{orderId}} has been successfully placed. Total: {{amount}}.",
    "ORDER_UPDATE": "Hi {{name}}, your order {{orderId}} status has been updated to: {{status}}."
};

/**
 * Replace placeholders like {{name}} with values from the payload.
 */
const interpolateTemplate = (template, payload) => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return payload[key] !== undefined ? payload[key] : match;
    });
};

/** Common transport API; provider acceptance is not handset delivery. */
export async function sendTextSMS(phone, message, { eventName = "ADMIN_TEST", settings, draft = {} } = {}) {
    let result, provider = draft.smsProvider || settings?.smsProvider || "sms_gate";
    try {
        const normalized = normalizePhone(phone);
        if (!normalized || typeof message !== "string" || !message.trim()) {
            result = { status: "skipped", errorCode: "invalid_message_or_phone" };
        } else {
            const current = settings ?? await getLocalSettingsModel()?.findOne();
            provider = draft.smsProvider || current?.smsProvider || "sms_gate";
            const config = resolveSmsConfig(current, draft);
            provider = config.provider;
            result = await sendWithProvider(config, normalized, message);
        }
    } catch {
        result = { status: "skipped", errorCode: "configuration_error" };
    }
    if (typeof provider !== "string" || !/^[a-z][a-z0-9_]{0,63}$/.test(provider)) provider = "unconfigured";
    try {
        await getLocalSmsAttemptModel()?.create({ eventName, provider, ...result });
    } catch {
        console.error("SMS attempt metadata could not be stored.");
    }
    return { provider, ...result };
}

// Existing event callers retain their boolean contract and template behavior.
export async function sendSMS(eventName, phone, payload = {}) {
    try {
        const Model = getLocalSmsTemplateModel();
        if (!Model || !getLocalSettingsModel()) return false;
        const template = await Model.findOne({ eventName });
        if (template && !template.isActive) return false;
        const message = template?.messageTemplate || DEFAULT_TEMPLATES[eventName];
        if (!message) return false;
        const result = await sendTextSMS(phone, interpolateTemplate(message, payload), { eventName });
        return result.status === "accepted";
    } catch {
        console.error("SMS event could not be processed.");
        return false;
    }
}
