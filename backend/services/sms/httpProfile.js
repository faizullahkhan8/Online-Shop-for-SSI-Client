import { ErrorResponse } from "../../utils/ErrorResponse.js";

const own = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);
const fail = () => { throw new ErrorResponse("Invalid server SMS HTTP profile configuration.", 503); };
const identifier = value => typeof value === "string" && /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(value)
    && !["constructor", "prototype", "__proto__"].includes(value);
const pathValue = (data, path) => path?.split(".").reduce((value, key) => own(value, key) ? value[key] : undefined, data);

function render(value, variables) {
    if (typeof value === "string") return value.replace(/\{\{([^{}]+)\}\}/g, (_, key) => {
        const result = pathValue(variables, key);
        if (result === undefined) throw new ErrorResponse("Unknown SMS profile placeholder.", 503);
        return String(result);
    });
    if (Array.isArray(value)) return value.map(item => render(item, variables));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, render(item, variables)]));
    return value;
}

export function createHttpProfile(profile) {
    if (!profile || !identifier(profile.id) || !/^http_[a-z0-9_]+$/.test(profile.id) || typeof profile.label !== "string"
        || !Array.isArray(profile.fields) || profile.fields.length > 30) fail();
    let endpoint;
    try { endpoint = new URL(profile.url); } catch { fail(); }
    // URLs come only from deployment configuration, never from an admin request/draft.
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.hash || /[{}]/.test(profile.url)) fail();
    if (!["json", "form"].includes(profile.encoding) || !profile.body || typeof profile.body !== "object" || Array.isArray(profile.body)) fail();
    const fields = profile.fields.map(field => {
        if (!identifier(field.key) || field.key === "provider" || typeof field.label !== "string" || (field.env !== undefined && !/^[A-Z][A-Z0-9_]+$/.test(field.env))) fail();
        return { key: field.key, label: field.label.slice(0, 100), secret: field.secret === true,
            required: field.required !== false, env: field.env };
    });
    if (new Set(fields.map(f => f.key)).size !== fields.length) fail();
    const fieldKeys = new Set(fields.map(f => f.key));
    const auth = profile.auth || { type: "none" };
    if (!["none", "bearer", "basic", "header"].includes(auth.type)) fail();
    for (const key of auth.type === "basic" ? [auth.usernameField, auth.passwordField] : auth.type === "none" ? [] : [auth.field]) {
        if (!fieldKeys.has(key)) fail();
    }
    // Auth tokens/passwords must remain secret even if a profile omits the flag.
    const authSecret = auth.type === "basic" ? auth.passwordField : auth.type === "none" ? undefined : auth.field;
    if (authSecret) fields.find(field => field.key === authSecret).secret = true;
    const headerName = name => typeof name === "string" && /^[a-zA-Z0-9-]+$/.test(name)
        && !["host", "connection", "content-length", "transfer-encoding", "cookie", "proxy-authorization"].includes(name.toLowerCase());
    if (auth.type === "header" && !headerName(auth.header)) fail();
    for (const [name, value] of Object.entries(profile.headers || {})) {
        if (!headerName(name) || typeof value !== "string" || /[\r\n]/.test(value)) fail();
    }
    const response = profile.response || {};
    for (const path of [response.messageIdPath, response.successPath, response.failurePath].filter(Boolean)) {
        if (typeof path !== "string" || path.length > 150 || !path.split(".").every(key => /^[a-zA-Z0-9_]+$/.test(key) && !["__proto__", "constructor", "prototype"].includes(key))) fail();
    }
    if (response.successPath && (!Array.isArray(response.successValues) || !response.successValues.length)) fail();
    if (response.failurePath && !Array.isArray(response.failureValues)) fail();
    if (!response.successPath && response.acceptHttpSuccess !== true) fail();
    if (![undefined, "e164", "international_digits", "pakistan_local"].includes(profile.phoneFormat)) fail();
    const variables = { phone: "+12025550123", e164Phone: "+12025550123", message: "test",
        field: Object.fromEntries(fields.map(field => [field.key, "test"])) };
    // Validate templates before a profile can become selectable.
    render(profile.body, variables);
    render(profile.headers || {}, variables);
    if (profile.encoding === "form" && Object.values(profile.body).some(value => value !== null && typeof value === "object")) fail();
    return {
        id: profile.id, label: profile.label.slice(0, 100), fields,
        request(config, phone, message) {
            let formatted = phone;
            if (profile.phoneFormat === "international_digits") formatted = phone.slice(1);
            if (profile.phoneFormat === "pakistan_local") {
                if (!phone.startsWith("+923")) throw new ErrorResponse("This SMS profile supports Pakistani mobile numbers only.", 400);
                formatted = "0" + phone.slice(3);
            }
            const vars = { phone: formatted, e164Phone: phone, message, field: config };
            const headers = render(profile.headers || {}, vars);
            if (Object.values(headers).some(value => /[\r\n]/.test(value))) throw new ErrorResponse("Invalid SMS header value.", 400);
            if (auth.type === "bearer") headers.Authorization = `Bearer ${config[auth.field]}`;
            if (auth.type === "basic") headers.Authorization = `Basic ${Buffer.from(`${config[auth.usernameField]}:${config[auth.passwordField]}`).toString("base64")}`;
            if (auth.type === "header") headers[auth.header] = config[auth.field];
            const body = render(profile.body, vars);
            headers["Content-Type"] = profile.encoding === "json" ? "application/json" : "application/x-www-form-urlencoded";
            return { url: endpoint.href, headers, body: profile.encoding === "json" ? JSON.stringify(body) : new URLSearchParams(body).toString() };
        },
        interpret(data) {
            if (response.failurePath && response.failureValues.includes(pathValue(data, response.failurePath))) return { status: "rejected", errorCode: "provider_rejected" };
            if (response.successPath && !response.successValues.includes(pathValue(data, response.successPath))) return { status: "unknown", errorCode: "unrecognized_response" };
            const id = pathValue(data, response.messageIdPath);
            return { status: "accepted", ...(["string", "number"].includes(typeof id) ? { messageId: String(id).slice(0, 150) } : {}) };
        },
    };
}

export function loadHttpProfiles() {
    const raw = process.env.SMS_HTTP_PROFILES_JSON;
    if (!raw) return [];
    if (Buffer.byteLength(raw) > 65536) fail();
    let profiles;
    try { profiles = JSON.parse(raw); } catch { fail(); }
    if (!Array.isArray(profiles) || profiles.length > 20) fail();
    return profiles.map(createHttpProfile);
}
