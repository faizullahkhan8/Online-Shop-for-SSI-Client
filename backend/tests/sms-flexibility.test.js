import { it } from "node:test";
import assert from "node:assert/strict";
import { createHttpProfile } from "../services/sms/httpProfile.js";
import { getSmsProviders, smsProviderMetadata } from "../services/sms/registry.js";
import { sendWithProvider } from "../services/sms/providers.js";
import { resolveSmsConfig, validateSmsDraft } from "../services/sms/config.js";

const profile = () => ({ id: "http_test", label: "Synthetic provider", url: "https://sms.example.test/messages", encoding: "json",
    auth: { type: "bearer", field: "token" }, fields: [{ key: "token", label: "Token", secret: true }, { key: "sender", label: "Sender", required: false }],
    body: { targets: ["{{phone}}"], content: { text: "{{message}}" }, sender: "{{field.sender}}" },
    response: { successPath: "result.ok", successValues: [true], failurePath: "result.ok", failureValues: [false], messageIdPath: "result.id" } });

it("adds a JSON HTTP service through configuration and routes it through the common sender", async () => {
    const old = process.env.SMS_HTTP_PROFILES_JSON;
    process.env.SMS_HTTP_PROFILES_JSON = JSON.stringify([profile()]);
    try {
        assert.ok(getSmsProviders().some(p => p.id === "http_test"));
        const definition = smsProviderMetadata().find(p => p.id === "http_test");
        assert.deepEqual(definition.fields.map(f => f.key), ["token", "sender"]);
        assert.equal(JSON.stringify(definition).includes("https://"), false);
        const draft = { smsProvider: "http_test", smsConfiguration: { token: "synthetic-secret", sender: "Zada" } };
        validateSmsDraft(draft);
        const config = resolveSmsConfig({}, draft);
        const result = await sendWithProvider(config, "+923001234567", 'Quoted "message"\nwith newline', { fetchImpl: async (url, options) => {
            assert.equal(url, "https://sms.example.test/messages");
            assert.equal(options.headers.Authorization, "Bearer synthetic-secret");
            assert.deepEqual(JSON.parse(options.body), { targets: ["+923001234567"], content: { text: 'Quoted "message"\nwith newline' }, sender: "Zada" });
            return Response.json({ result: { ok: true, id: 123 } });
        } });
        assert.deepEqual(result, { status: "accepted", messageId: "123" });
    } finally {
        if (old === undefined) delete process.env.SMS_HTTP_PROFILES_JSON;
        else process.env.SMS_HTTP_PROFILES_JSON = old;
    }
});

it("supports form bodies, API-key headers, phone formatting, and explicit response mapping", () => {
    const raw = profile();
    Object.assign(raw, { encoding: "form", phoneFormat: "international_digits", auth: { type: "header", header: "X-API-Key", field: "token" }, body: { to: "{{phone}}", text: "{{message}}" } });
    raw.fields[0].secret = false;
    const adapter = createHttpProfile(raw);
    assert.equal(adapter.fields[0].secret, true);
    const request = adapter.request({ token: "synthetic-token" }, "+923001234567", "text & unicode اردو");
    assert.equal(request.headers["X-API-Key"], "synthetic-token");
    assert.deepEqual(Object.fromEntries(new URLSearchParams(request.body)), { to: "923001234567", text: "text & unicode اردو" });
    assert.equal(adapter.interpret({ result: { ok: false } }).status, "rejected");
    assert.equal(adapter.interpret({ unexpected: true }).status, "unknown");
    assert.equal(adapter.interpret(undefined).status, "unknown");
});

it("supports Basic auth, credentials in POST bodies, and local Pakistani phone formatting", () => {
    const raw = profile();
    Object.assign(raw, { phoneFormat: "pakistan_local", auth: { type: "basic", usernameField: "sender", passwordField: "token" },
        body: { recipient: "{{phone}}", international: "{{e164Phone}}", api_key: "{{field.token}}", text: "{{message}}" } });
    const adapter = createHttpProfile(raw);
    const request = adapter.request({ token: "synthetic-token", sender: "synthetic-user" }, "+923001234567", "test");
    assert.equal(request.headers.Authorization, "Basic " + Buffer.from("synthetic-user:synthetic-token").toString("base64"));
    assert.equal(JSON.parse(request.body).recipient, "03001234567");
    assert.equal(JSON.parse(request.body).international, "+923001234567");
    assert.throws(() => adapter.request({ token: "x", sender: "y" }, "+12025550123", "test"), /Pakistani/);
});

it("rejects unsafe/malformed profiles and unknown credentials without exposing server values", () => {
    for (const change of [{ url: "http://sms.example.test" }, { url: "https://user:password@sms.example.test" },
        { url: "https://{{field.token}}.example.test" }, { fields: [{ key: "constructor", label: "bad" }] },
        { body: { text: "{{field.undeclared}}" } }, { headers: { Host: "internal" } },
        { response: {} }, { response: { successPath: "__proto__.ok", successValues: [true] } }]) {
        assert.throws(() => createHttpProfile({ ...profile(), ...change }));
    }
    assert.throws(() => validateSmsDraft({ smsProvider: "twilio", smsConfiguration: { endpoint: "https://internal.test" } }), /Invalid SMS provider field/);
});
