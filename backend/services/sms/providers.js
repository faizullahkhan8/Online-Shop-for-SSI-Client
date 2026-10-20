import { getSmsProvider } from "./registry.js";

export async function sendWithProvider(config, phone, message, { fetchImpl = globalThis.fetch, timeoutMs = 10000 } = {}) {
    const adapter = getSmsProvider(config.provider);
    if (!adapter) return { status: "rejected", errorCode: "unsupported_provider" };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const request = await adapter.request(config, phone, message);
        const response = await fetchImpl(request.url, { method: request.method || "POST", headers: request.headers,
            body: request.body, signal: controller.signal, redirect: "error" });
        // Do not expose/log vendor response bodies: they may contain phone numbers or credentials.
        let data;
        try { data = await response.json(); } catch { /* Acceptance may be known only by HTTP status. */ }
        if (!response.ok) return { status: response.status >= 500 ? "unknown" : "rejected", errorCode: `http_${response.status}` };
        return adapter.interpret(data);
    } catch {
        // A timeout/network failure can happen after acceptance. Never retry or switch providers automatically.
        return { status: "unknown", errorCode: controller.signal.aborted ? "timeout" : "network_error" };
    } finally {
        clearTimeout(timer);
    }
}
