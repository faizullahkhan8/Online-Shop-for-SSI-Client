import { decrypt, encrypt } from "../../utils/encryption.js";
import { ErrorResponse } from "../../utils/ErrorResponse.js";
import { getSmsProvider, getSmsProviders } from "./registry.js";

export function normalizePhone(phone) {
    if (typeof phone !== "string") return "";
    let value = phone.trim().replace(/[\s()-]/g, "");
    if (/^03\d{9}$/.test(value)) value = "+92" + value.slice(1);
    else if (/^92\d{10}$/.test(value)) value = "+" + value;
    else if (/^[1-9]\d{7,14}$/.test(value)) value = "+" + value;
    return /^\+[1-9]\d{7,14}$/.test(value) ? value : "";
}


const object = value => value instanceof Map ? Object.fromEntries(value) : value || {};
function storedFields(settings, id) {
    return object(object(settings?.smsConfigurations)[id]?.values);
}
function fieldDraft(draft, field) {
    return draft.smsConfiguration?.[field.key] ?? (field.setting ? draft[field.setting] : undefined);
}

export function resolveSmsConfig(settings = {}, draft = {}) {
    const provider = draft.smsProvider ?? settings?.smsProvider ?? "sms_gate";
    const definition = getSmsProvider(provider);
    if (!definition) throw new ErrorResponse("Unsupported SMS provider.", 400);
    const saved = storedFields(settings, provider);
    const stored = field => field.setting ? settings?.[field.setting] : saved[field.key];
    const hasStored = definition.fields.some(field => fieldDraft(draft, field) || stored(field));
    const config = { provider };
    for (const field of definition.fields) {
        let value;
        if (!hasStored) value = field.env ? process.env[field.env] : "";
        else if (field.secret) value = fieldDraft(draft, field) || (stored(field) ? decrypt(stored(field)) : "");
        else value = fieldDraft(draft, field) ?? stored(field);
        value = value || "";
        if ((field.required && !value) || (value && field.pattern && !new RegExp(field.pattern).test(value))) {
            throw new ErrorResponse(`Configure a valid ${definition.label}: ${field.label}.`, 400);
        }
        config[field.key] = value;
    }
    return config;
}

export function validateSmsDraft(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ErrorResponse("Invalid SMS configuration.", 400);
    if (body.smsProvider !== undefined && !getSmsProvider(body.smsProvider)) throw new ErrorResponse("Unsupported SMS provider.", 400);
    const legacyFields = getSmsProviders().flatMap(provider => provider.fields.filter(field => field.setting).map(field => field.setting));
    for (const key of legacyFields) {
        if (body[key] !== undefined && (typeof body[key] !== "string" || body[key].length > 4096)) throw new ErrorResponse(`Invalid ${key}.`, 400);
    }
    if (body.smsConfiguration !== undefined) {
        const values = body.smsConfiguration;
        const definition = getSmsProvider(body.smsProvider);
        if (!definition || !values || typeof values !== "object" || Array.isArray(values)) throw new ErrorResponse("Select a provider for SMS configuration.", 400);
        const allowed = new Set(definition.fields.map(field => field.key));
        for (const [key, value] of Object.entries(values)) {
            if (!allowed.has(key) || typeof value !== "string" || value.length > 4096) throw new ErrorResponse("Invalid SMS provider field.", 400);
        }
    }
}

// Existing flat fields remain compatible; new definitions use the generic encrypted store.
export function applySmsConfiguration(settings, body) {
    const definitions = getSmsProviders();
    for (const definition of definitions) {
        const saved = { ...storedFields(settings, definition.id) };
        let changed = false;
        for (const field of definition.fields) {
            const value = definition.id === body.smsProvider ? fieldDraft(body, field) : field.setting ? body[field.setting] : undefined;
            if (value === undefined || (field.secret && !value)) continue;
            const stored = field.secret ? encrypt(value) : value;
            if (field.setting) settings[field.setting] = stored;
            else { saved[field.key] = stored; changed = true; }
        }
        if (changed) settings.smsConfigurations.set(definition.id, { values: saved });
    }
    if (body.smsProvider !== undefined) settings.smsProvider = body.smsProvider;
}

export function serializeSmsConfigurations(settings) {
    return Object.fromEntries(getSmsProviders().map(provider => {
        const saved = storedFields(settings, provider.id);
        return [provider.id, {
            values: Object.fromEntries(provider.fields.filter(field => !field.secret).map(field => [field.key, (field.setting ? settings?.[field.setting] : saved[field.key]) || ""])),
            configured: Object.fromEntries(provider.fields.filter(field => field.secret).map(field => [field.key, Boolean(field.setting ? settings?.[field.setting] : saved[field.key])])),
        }];
    }));
}
