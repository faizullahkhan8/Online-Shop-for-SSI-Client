import { loadHttpProfiles } from "./httpProfile.js";
import { ErrorResponse } from "../../utils/ErrorResponse.js";

// Adding a custom-code provider requires one definition with fields/request/interpret.
const builtins = [
    {
        id: "sms_gate", label: "SMS Gateway (sms-gate.app)",
        fields: [
            { key: "username", label: "Gateway username", setting: "smsGatewayUsername", env: "SMS_GATE_USERNAME", required: true },
            { key: "password", label: "Gateway password", setting: "smsGatewayPassword", env: "SMS_GATE_PASSWORD", secret: true, required: true },
        ],
        request: ({ username, password }, phone, message) => ({
            url: "https://api.sms-gate.app/3rdparty/v1/messages",
            headers: { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`, "Content-Type": "application/json" },
            body: JSON.stringify({ textMessage: { text: message }, phoneNumbers: [phone] }),
        }),
        interpret: data => ["failed", "Failed"].includes(data?.state)
            ? { status: "rejected", errorCode: "provider_rejected" }
            : { status: "accepted", ...(typeof data?.id === "string" ? { messageId: data.id.slice(0, 150) } : {}) },
    },
    {
        id: "twilio", label: "Twilio",
        fields: [
            { key: "accountSid", label: "Account SID", setting: "smsTwilioAccountSid", env: "TWILIO_ACCOUNT_SID", required: true, pattern: "^AC[a-fA-F0-9]{32}$" },
            { key: "authToken", label: "Auth token", setting: "smsTwilioAuthToken", env: "TWILIO_AUTH_TOKEN", secret: true, required: true },
            { key: "from", label: "Sender phone number", setting: "smsTwilioFrom", env: "TWILIO_FROM", required: true, pattern: "^\\+[1-9]\\d{7,14}$" },
        ],
        request: ({ accountSid, authToken, from }, phone, message) => ({
            url: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            headers: { Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ To: phone, From: from, Body: message }).toString(),
        }),
        interpret: data => ["failed", "undelivered", "canceled"].includes(data?.status)
            ? { status: "rejected", errorCode: "provider_rejected" }
            : { status: "accepted", ...(typeof data?.sid === "string" ? { messageId: data.sid.slice(0, 150) } : {}) },
    },
];

export function getSmsProviders() {
    const definitions = [...builtins, ...loadHttpProfiles()];
    if (new Set(definitions.map(p => p.id)).size !== definitions.length) throw new ErrorResponse("Duplicate SMS provider IDs in server configuration.", 503);
    return definitions;
}
export const getSmsProvider = id => getSmsProviders().find(provider => provider.id === id);
export const smsProviderMetadata = () => getSmsProviders().map(({ id, label, fields }) => ({
    id, label, fields: fields.map(({ key, label, secret, required, setting }) => ({ key, label, secret: Boolean(secret), required: Boolean(required), ...(setting ? { setting } : {}) })),
}));
