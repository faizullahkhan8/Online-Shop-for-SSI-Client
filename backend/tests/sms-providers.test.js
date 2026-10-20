import { it } from "node:test";
import assert from "node:assert/strict";
import { sendWithProvider } from "../services/sms/providers.js";
import { normalizePhone, resolveSmsConfig } from "../services/sms/config.js";

const gate = { provider: "sms_gate", username: "synthetic-user", password: "synthetic-password" };
const twilio = { provider: "twilio", accountSid: "AC" + "a".repeat(32), authToken: "synthetic-token", from: "+12025550123" };

it("normalizes Pakistani and international numbers while rejecting invalid recipients", () => {
    assert.equal(normalizePhone("0300 1234567"), "+923001234567");
    assert.equal(normalizePhone("923001234567"), "+923001234567");
    assert.equal(normalizePhone("+12025550123"), "+12025550123");
    for (const value of [null, {}, "abc", "+", "00000000000", "+92+3001234567", "123"]) assert.equal(normalizePhone(value), "");
});

it("sends the existing gateway request once and returns safe acceptance metadata", async () => {
    let count = 0;
    const result = await sendWithProvider(gate, "+923001234567", "synthetic-message", { fetchImpl: async (url, options) => {
        count++;
        assert.equal(url, "https://api.sms-gate.app/3rdparty/v1/messages");
        assert.equal(options.redirect, "error");
        assert.equal(options.headers.Authorization, "Basic " + Buffer.from("synthetic-user:synthetic-password").toString("base64"));
        assert.deepEqual(JSON.parse(options.body), { textMessage: { text: "synthetic-message" }, phoneNumbers: ["+923001234567"] });
        return Response.json({ id: "gateway-test-id", state: "Pending" }, { status: 202 });
    } });
    assert.deepEqual(result, { status: "accepted", messageId: "gateway-test-id" });
    assert.equal(count, 1);
});

it("adapts Twilio form authentication and message fields without changing event callers", async () => {
    const result = await sendWithProvider(twilio, "+923001234567", "synthetic-message", { fetchImpl: async (url, options) => {
        assert.equal(url, `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`);
        assert.equal(options.headers.Authorization, "Basic " + Buffer.from(`${twilio.accountSid}:synthetic-token`).toString("base64"));
        assert.deepEqual(Object.fromEntries(new URLSearchParams(options.body)), { To: "+923001234567", From: twilio.from, Body: "synthetic-message" });
        return Response.json({ sid: "SM-test-id", status: "queued" }, { status: 201 });
    } });
    assert.deepEqual(result, { status: "accepted", messageId: "SM-test-id" });
});

it("redacts vendor errors and distinguishes rejection from uncertain outcomes", async () => {
    for (const [code, status] of [[401, "rejected"], [429, "rejected"], [500, "unknown"]]) {
        const result = await sendWithProvider(gate, "+923001234567", "private", {
            fetchImpl: async () => Response.json({ message: "sensitive-vendor-response" }, { status: code }) });
        assert.deepEqual(result, { status, errorCode: `http_${code}` });
    }
    const rejected = await sendWithProvider(twilio, "+923001234567", "private", {
        fetchImpl: async () => Response.json({ status: "failed", error_message: "sensitive" }) });
    assert.equal(rejected.status, "rejected");
});

it("times out with exactly one attempt and never retries or falls back", async () => {
    let calls = 0;
    const result = await sendWithProvider(twilio, "+923001234567", "private", { timeoutMs: 10,
        fetchImpl: async (_, { signal }) => {
            calls++;
            return new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("timeout")), { once: true }));
        } });
    assert.deepEqual(result, { status: "unknown", errorCode: "timeout" });
    assert.equal(calls, 1);
});

it("fails closed on unsupported providers and never borrows another provider's credentials", () => {
    assert.throws(() => resolveSmsConfig({ smsProvider: "arbitrary-url" }), /Unsupported/);
    assert.throws(() => resolveSmsConfig({ smsProvider: "twilio", smsGatewayUsername: "old-user", smsTwilioAccountSid: "invalid" }), /Twilio/);
});
