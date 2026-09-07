import { getLocalSmsTemplateModel } from "../config/localDb.js";
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

/**
 * Normalizes phone numbers to E.164 format.
 * If number starts with 03 (Pakistan), it converts to +923.
 */
const normalizePhoneNumber = (phone) => {
    if (!phone) return "";
    let clean = phone.replace(/[^0-9+]/g, ''); // keep only digits and +
    
    // Auto convert Pakistani 0300 to +92300
    if (clean.startsWith('03') && clean.length === 11) {
        return '+92' + clean.substring(1);
    }
    
    // If user entered just numbers without +, but starts with 92
    if (clean.startsWith('92') && clean.length === 12) {
        return '+' + clean;
    }

    // If it doesn't start with +, just prepend + assuming they typed country code
    if (!clean.startsWith('+')) {
        return '+' + clean;
    }

    return clean;
};

export const sendSMS = async (eventName, phone, payload = {}) => {
    try {
        const SmsTemplateModel = getLocalSmsTemplateModel();
        if (!SmsTemplateModel) {
            console.warn("SMS Service: Database model not found.");
            return false;
        }

        const templateDoc = await SmsTemplateModel.findOne({ eventName });
        
        let messageText = "";

        if (templateDoc) {
            if (!templateDoc.isActive) {
                console.log(`SMS Service: Template for ${eventName} is disabled. Skipping SMS.`);
                return false;
            }
            messageText = templateDoc.messageTemplate;
        } else {
            // Fallback to default if not seeded yet
            if (DEFAULT_TEMPLATES[eventName]) {
                messageText = DEFAULT_TEMPLATES[eventName];
            } else {
                console.warn(`SMS Service: No template found for ${eventName}`);
                return false;
            }
        }

        const finalMessage = interpolateTemplate(messageText, payload);
        const normalizedPhone = normalizePhoneNumber(phone);

        if (!normalizedPhone || !finalMessage) {
            console.error("SMS Service: Missing phone or message content");
            return false;
        }

        const username = process.env.SMS_GATE_USERNAME;
        const password = process.env.SMS_GATE_PASSWORD;

        if (!username || !password) {
            console.warn("SMS Service: SMS_GATE_USERNAME or SMS_GATE_PASSWORD is not set. SMS not sent.");
            return false;
        }

        const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

        const res = await fetch('https://api.sms-gate.app/3rdparty/v1/message', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                textMessage: { text: finalMessage },
                phoneNumbers: [normalizedPhone],
            }),
        });

        const data = await res.json();
        
        if (res.ok) {
            console.log(`SMS Service: Successfully sent SMS for ${eventName} to ${normalizedPhone}`);
            return true;
        } else {
            console.error(`SMS Service: Failed to send SMS via sms-gate.app. Response:`, data);
            return false;
        }
    } catch (error) {
        console.error("SMS Service Error:", error);
        return false;
    }
};
