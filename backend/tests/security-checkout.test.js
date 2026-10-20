import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { io as connectSocket } from "socket.io-client";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import * as db from "../config/localDb.js";
import { getIO } from "../config/socket.js";
import { decrypt } from "../utils/encryption.js";
import { sendSMS } from "../utils/smsService.js";

let replica, server, base, admin, customer, other, adminAuth, customerAuth;
let number = 0;
const sockets = [];
async function request(path, { method = "GET", body, cookie, key = randomUUID() } = {}) {
    const response = await fetch(base + "/api" + path, {
        method, headers: { "Content-Type": "application/json", "Idempotency-Key": key, ...(cookie ? { cookie } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json(),
        cookie: response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ") };
}
async function login(user) {
    const result = await request("/users/login", { method: "POST", body: { email: user.email, password: "local-test-password" } });
    assert.equal(result.status, 200);
    return result;
}
async function product(stock = 10) {
    const category = await db.getLocalCategoryModel().create({ name: `test-category-${++number}` });
    return db.getLocalProductModel().create({ name: `Test product ${number}`, price: 100,
        category: category._id, stock, lowStock: 2 });
}
function orderPayload(item, extra = {}) {
    return { items: [{ product: String(item._id), quantity: 1 }],
        recipient: { name: "Test customer", street: "Test street", city: "Bannu", phone: "00000000000" },
        payment: { method: "COD", ispaid: false }, ...extra };
}
function assertSafe(value) {
    if (!value || typeof value !== "object") return;
    for (const [key, nested] of Object.entries(value)) {
        assert.ok(!["password", "phoneVerificationOtp", "phoneVerificationExpires"].includes(key), `Unsafe field: ${key}`);
        assertSafe(nested);
    }
}
async function socket(cookie) {
    const client = connectSocket(base, { transports: ["websocket"], forceNew: true,
        reconnection: false, timeout: 3000, extraHeaders: cookie ? { Cookie: cookie } : {} });
    sockets.push(client);
    await Promise.race([
        once(client, "connect"),
        once(client, "connect_error").then(([error]) => { throw error; }),
    ]);
    return client;
}
const acknowledgement = (client, event, ...args) => new Promise((resolve, reject) => {
    client.timeout(2000).emit(event, ...args, (error, value) => error ? reject(error) : resolve(value));
});

describe("P1 and P2 account, shopping, reporting, and socket regressions", { concurrency: false }, () => {
    before(async () => {
        replica = await MongoMemoryReplSet.create({ binary: { version: "7.0.14" }, replSet: { count: 1, ip: "127.0.0.1" } });
        process.env.MONGO_URI_ONLINE = replica.getUri();
        process.env.JWT_ACCESS_SECRET = "isolated-access-test-secret";
        process.env.JWT_REFRESH_SECRET = "isolated-refresh-test-secret";
        process.env.PORT = "0";
        process.env.SMS_GATE_USERNAME = "";
        process.env.SMS_GATE_PASSWORD = "";
        process.env.TWILIO_ACCOUNT_SID = "";
        process.env.TWILIO_AUTH_TOKEN = "";
        process.env.TWILIO_FROM = "";
        process.env.ENCRYPTION_KEY = "testonly".repeat(4);
        await db.connectToDB();
        const User = db.getLocalUserModel();
        [admin, customer, other] = await User.create(["admin", "user", "user"].map((role, index) => ({
            name: `Test account ${index}`, email: `account${index}@example.test`, role,
            password: "local-test-password", isPhoneVerified: true,
        })));
        await Promise.all([db.getLocalOrderModel(), db.getLocalProductModel(), db.getLocalPromotionModel(), db.getLocalSettingsModel()]
            .map((model) => model.init()));
        ({ server } = await import("../index.js"));
        if (!server.listening) await once(server, "listening");
        base = `http://127.0.0.1:${server.address().port}`;
        adminAuth = await login(admin);
        customerAuth = await login(customer);
    });
    beforeEach(async () => {
        await db.getLocalSettingsModel().deleteMany({});
        await db.getLocalSettingsModel().create({ taxAmount: 20, shippingFee: 150, shippingMethod: "standard" });
    });
    after(async () => {
        sockets.forEach((client) => client.close());
        if (getIO()) await new Promise((resolve) => getIO().close(resolve));
        if (db.getLocalUserModel()) await db.getLocalUserModel().db.close();
        await replica?.stop();
    });

    it("merges variant checkout with authoritative pricing, atomic stock and once-only restoration", async () => {
        const item = await product(3);
        item.hasVariants = true;
        item.variants = [{ name: "Small", price: 100, stock: 1 }, { name: "Large", price: 250, stock: 2 }];
        await item.save();
        const [small, large] = item.variants;
        const lines = [{ product: String(item._id), variantId: String(small._id), quantity: 1 }, { product: String(item._id), variantId: String(large._id), quantity: 2 }];
        assert.equal((await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie, body: orderPayload(item) })).status, 400);
        const key = randomUUID();
        const body = orderPayload(item, { items: lines });
        const placed = await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie, body, key });
        assert.equal(placed.status, 201, JSON.stringify(placed.body));
        assert.equal(placed.body.order.items.reduce((sum, line) => sum + line.totalAmount, 0), 600);
        assert.equal((await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie, body, key })).status, 200);
        let saved = await db.getLocalProductModel().findById(item._id);
        assert.equal(saved.stock, 0); assert.deepEqual(saved.variants.map(v => v.stock), [0, 0]);
        const cancelled = await Promise.all([1, 2].map(() => request(`/orders/${placed.body.order._id}/cancel`, { method: "PUT", cookie: customerAuth.cookie, body: {} })));
        assert.ok(cancelled.every(result => result.status === 200));
        saved = await db.getLocalProductModel().findById(item._id);
        assert.equal(saved.stock, 3); assert.equal(saved.sold, 0); assert.deepEqual(saved.variants.map(v => v.stock), [1, 2]);
    });

    it("prevents competing variant oversells and rolls back an overdrawn shared stock order", async () => {
        const item = await product(1);
        item.variants = [{ name: "One", price: 120, stock: 1 }]; await item.save();
        const body = orderPayload(item, { items: [{ product: String(item._id), variantId: String(item.variants[0]._id), quantity: 1 }] });
        const results = await Promise.all([1, 2].map(() => request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie, body })));
        assert.equal(results.filter(result => result.status === 201).length, 1);
        const shared = await product(1);
        shared.variants = [{ name: "Red", price: 100, stock: 0 }, { name: "Blue", price: 200, stock: 0 }]; await shared.save();
        const lines = shared.variants.map(v => ({ product: String(shared._id), variantId: String(v._id), quantity: 1 }));
        const failed = await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie, body: orderPayload(shared, { items: lines }) });
        assert.equal(failed.status, 409);
        assert.equal((await db.getLocalProductModel().findById(shared._id)).stock, 1);
        const placed = await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie, body: orderPayload(shared, { items: [lines[0]] }) });
        assert.equal(placed.status, 201); assert.equal(placed.body.order.items[0].usesSharedStock, true);
        assert.equal((await request(`/orders/${placed.body.order._id}/cancel`, { method: "PUT", cookie: customerAuth.cookie, body: {} })).status, 200);
        const saved = await db.getLocalProductModel().findById(shared._id);
        assert.equal(saved.stock, 1); assert.deepEqual(saved.variants.map(v => v.stock), [0, 0]);
    });

    it("keeps gateway credentials private and preserves passwords on unrelated admin saves", async () => {
        const payload = { taxAmount: 25, shippingFee: 120, shippingMethod: "standard",
            smsGatewayUsername: "synthetic-gateway-user", smsGatewayPassword: "synthetic-gateway-password",
            paymentMethods: [{ title: "COD", isActive: true, information: "Pay on delivery", imagekitFileId: "internal-file" },
                { title: "Disabled bank", isActive: false }] };
        assert.equal((await request("/settings/admin")).status, 401);
        assert.equal((await request("/settings/admin", { cookie: customerAuth.cookie })).status, 401);
        assert.equal((await request("/settings", { method: "PUT", body: payload })).status, 401);
        assert.equal((await request("/settings", { method: "PUT", body: payload, cookie: customerAuth.cookie })).status, 401);
        const saved = await request("/settings", { method: "PUT", body: payload, cookie: adminAuth.cookie });
        assert.equal(saved.status, 200);
        assert.equal(saved.body.settings.smsGatewayPasswordConfigured, true);
        assert.equal(saved.body.settings.smsGatewayPassword, undefined);
        const stored = await db.getLocalSettingsModel().findOne();
        assert.notEqual(stored.smsGatewayPassword, payload.smsGatewayPassword);
        assert.equal(decrypt(stored.smsGatewayPassword), payload.smsGatewayPassword);
        const publicResponse = await request("/settings");
        assert.equal(publicResponse.status, 200);
        assert.equal(publicResponse.body.settings.taxAmount, 25);
        assert.equal(publicResponse.body.settings.smsGatewayUsername, undefined);
        assert.equal(publicResponse.body.settings.smsGatewayPassword, undefined);
        assert.equal(publicResponse.body.settings.smsGatewayPasswordConfigured, undefined);
        assert.equal(publicResponse.body.settings.paymentMethods.length, 1);
        assert.equal(publicResponse.body.settings.paymentMethods[0].imagekitFileId, undefined);
        const managed = await request("/settings/admin", { cookie: adminAuth.cookie });
        assert.equal(managed.body.settings.smsGatewayUsername, payload.smsGatewayUsername);
        assert.equal(managed.body.settings.smsGatewayPassword, undefined);
        assert.equal(managed.body.settings.paymentMethods.length, 2);
        assert.equal((await request("/settings", { method: "PUT", cookie: adminAuth.cookie,
            body: { ...payload, smsGatewayPassword: "" } })).status, 200);
        assert.equal((await db.getLocalSettingsModel().findOne()).smsGatewayPassword, stored.smsGatewayPassword);
        const replacement = await request("/settings", { method: "PUT", cookie: adminAuth.cookie,
            body: { ...payload, smsGatewayPassword: "replacement-test-only" } });
        assert.equal(replacement.status, 200);
        assert.equal(decrypt((await db.getLocalSettingsModel().findOne()).smsGatewayPassword), "replacement-test-only");
        await request("/settings", { method: "PUT", cookie: adminAuth.cookie,
            body: { ...payload, smsGatewayPassword: "", clearSmsGatewayPassword: true } });
        assert.equal((await db.getLocalSettingsModel().findOne()).smsGatewayPassword, "");
    });

    it("allows self and admin access but blocks cross-account reads and writes", async () => {
        assert.equal((await request(`/users/get/${customer._id}`, { cookie: customerAuth.cookie })).status, 200);
        assert.equal((await request(`/users/get/${other._id}`, { cookie: customerAuth.cookie })).status, 403);
        assert.equal((await request(`/users/update/${other._id}`, { method: "PUT", cookie: customerAuth.cookie,
            body: { name: "Unauthorized" } })).status, 403);
        assert.equal((await db.getLocalUserModel().findById(other._id)).name, other.name);
        const update = await request(`/users/update/${customer._id}`, { method: "PUT", cookie: customerAuth.cookie,
            body: { name: "Updated self" } });
        assert.equal(update.status, 200);
        assertSafe(update.body);
        assert.equal((await request(`/users/get/${other._id}`, { cookie: adminAuth.cookie })).status, 200);
    });

    it("tests draft providers without activation, protects metadata and throttles duplicate admin tests", async () => {
        const path = "/settings/sms/test";
        assert.equal((await request(path, { method: "POST", body: {} })).status, 401);
        assert.equal((await request(path, { method: "POST", body: {}, cookie: customerAuth.cookie })).status, 401);
        assert.equal((await request("/settings/sms/attempts")).status, 401);
        assert.equal((await request("/settings/sms/attempts", { cookie: customerAuth.cookie })).status, 401);
        const configuration = { smsProvider: "twilio", smsTwilioAccountSid: "AC" + "a".repeat(32),
            smsTwilioAuthToken: "synthetic-draft-token", smsTwilioFrom: "+12025550123" };
        const pending = await db.getLocalUserModel().create({ name: "Keep OTP", email: "provider-switch@example.test",
            password: "local-test-password", phoneVerificationOtp: "246810", phoneVerificationExpires: new Date(Date.now() + 60000) });
        const nativeFetch = globalThis.fetch;
        let sends = 0;
        globalThis.fetch = async (url, options) => {
            if (String(url).startsWith(base)) return nativeFetch(url, options);
            assert.ok(String(url).startsWith("https://api.twilio.com/"));
            sends++;
            return Response.json({ sid: "SM-draft-test", status: "queued" }, { status: 201 });
        };
        try {
            const invalid = await request(path, { method: "POST", cookie: adminAuth.cookie, body: { phone: "bad", configuration } });
            assert.equal(invalid.status, 400);
            const test = await request(path, { method: "POST", cookie: adminAuth.cookie, body: { phone: "03001234567", configuration } });
            assert.equal(test.status, 200);
            assert.equal(test.body.result.status, "accepted");
            const stored = await db.getLocalSettingsModel().findOne();
            assert.equal(stored.smsProvider, "sms_gate");
            assert.equal(stored.smsTwilioAuthToken, "");
            assert.equal((await request(path, { method: "POST", cookie: adminAuth.cookie, body: { phone: "03001234567", configuration } })).status, 429);
            assert.equal(sends, 1);
            const attempts = await request("/settings/sms/attempts", { cookie: adminAuth.cookie });
            assert.ok(attempts.body.attempts.some(a => a.messageId === "SM-draft-test"));
            const serialized = JSON.stringify(attempts.body);
            assert.ok(!serialized.includes("synthetic-draft-token"));
            assert.ok(!serialized.includes("03001234567"));
            assert.ok(!serialized.includes("246810"));
            assert.equal((await db.getLocalUserModel().findById(pending._id).select("+phoneVerificationOtp")).phoneVerificationOtp, "246810");
        } finally { globalThis.fetch = nativeFetch; }
    });

    it("activates providers with encrypted separate credentials, supports rollback, and rejects invalid switches", async () => {
        const config = { smsProvider: "twilio", smsTwilioAccountSid: "AC" + "b".repeat(32),
            smsTwilioAuthToken: "synthetic-active-token", smsTwilioFrom: "+12025550123",
            smsGatewayUsername: "retained-gateway-user", smsGatewayPassword: "retained-gateway-secret" };
        const save = body => request("/settings", { method: "PUT", cookie: adminAuth.cookie, body });
        assert.equal((await save({ smsProvider: "unknown" })).status, 400);
        assert.equal((await save({ smsProvider: "twilio" })).status, 400);
        assert.equal((await db.getLocalSettingsModel().findOne()).smsProvider, "sms_gate");
        const activated = await save(config);
        assert.equal(activated.status, 200);
        assert.equal(activated.body.settings.smsProvider, "twilio");
        assert.equal(activated.body.settings.smsTwilioAuthToken, undefined);
        assert.equal(activated.body.settings.smsTwilioAuthTokenConfigured, true);
        const stored = await db.getLocalSettingsModel().findOne();
        assert.equal(decrypt(stored.smsTwilioAuthToken), config.smsTwilioAuthToken);
        assert.equal((await request("/settings")).body.settings.smsTwilioAccountSid, undefined);
        assert.equal((await request("/settings")).body.settings.smsTwilioAuthTokenConfigured, undefined);
        assert.equal((await save({ smsProvider: "twilio", smsTwilioAuthToken: "" })).status, 200);
        assert.equal((await db.getLocalSettingsModel().findOne()).smsTwilioAuthToken, stored.smsTwilioAuthToken);
        const nativeFetch = globalThis.fetch;
        let sends = 0;
        globalThis.fetch = async (url, options) => {
            if (String(url).startsWith(base)) return nativeFetch(url, options);
            assert.ok(String(url).startsWith("https://api.twilio.com/"));
            assert.match(new URLSearchParams(options.body).get("Body"), /246810/);
            sends++;
            return Response.json({ sid: "SM-active-test", status: "queued" }, { status: 201 });
        };
        try {
            assert.equal(await sendSMS("REGISTRATION_OTP", "03001234567", { otp: "246810" }), true);
            assert.equal(sends, 1);
        } finally { globalThis.fetch = nativeFetch; }
        assert.equal((await save({ smsProvider: "sms_gate" })).status, 200);
        assert.equal(decrypt((await db.getLocalSettingsModel().findOne()).smsGatewayPassword), config.smsGatewayPassword);
    });

    it("discovers a configured HTTP service and stores its secrets without model or UI-specific fields", async () => {
        const original = process.env.SMS_HTTP_PROFILES_JSON;
        process.env.SMS_HTTP_PROFILES_JSON = JSON.stringify([{ id: "http_fixture", label: "Fixture SMS", url: "https://sms.example.test/send", encoding: "json",
            fields: [{ key: "apiKey", label: "API key", secret: true }, { key: "sender", label: "Sender" }],
            auth: { type: "header", header: "X-API-Key", field: "apiKey" }, body: { to: "{{phone}}", text: "{{message}}" },
            response: { successPath: "ok", successValues: [true], messageIdPath: "id" } }]);
        const save = body => request("/settings", { method: "PUT", cookie: adminAuth.cookie, body });
        try {
            const managed = await request("/settings/admin", { cookie: adminAuth.cookie });
            assert.ok(managed.body.settings.smsProviders.some(provider => provider.id === "http_fixture"));
            const configured = await save({ smsProvider: "http_fixture", smsConfiguration: { apiKey: "synthetic-flexible-secret", sender: "Zada" } });
            assert.equal(configured.status, 200);
            assert.equal(configured.body.settings.smsConfigurations.http_fixture.configured.apiKey, true);
            assert.equal(configured.body.settings.smsConfigurations.http_fixture.values.apiKey, undefined);
            assert.ok(!JSON.stringify(configured.body).includes("synthetic-flexible-secret"));
            const encrypted = (await db.getLocalSettingsModel().findOne()).smsConfigurations.get("http_fixture").values.get("apiKey");
            assert.equal(decrypt(encrypted), "synthetic-flexible-secret");
            assert.equal((await save({ smsProvider: "http_fixture", smsConfiguration: { apiKey: "", sender: "Zada 2" } })).status, 200);
            assert.equal((await db.getLocalSettingsModel().findOne()).smsConfigurations.get("http_fixture").values.get("apiKey"), encrypted);
            const nativeFetch = globalThis.fetch;
            globalThis.fetch = async (url, options) => {
                if (String(url).startsWith(base)) return nativeFetch(url, options);
                assert.equal(url, "https://sms.example.test/send");
                assert.equal(options.headers["X-API-Key"], "synthetic-flexible-secret");
                return Response.json({ ok: true, id: "flexible-provider-id" });
            };
            try { assert.equal(await sendSMS("ORDER_UPDATE", "03001234567", { name: "Test", orderId: "demo", status: "shipped" }), true); }
            finally { globalThis.fetch = nativeFetch; }
            const attempts = await request("/settings/sms/attempts", { cookie: adminAuth.cookie });
            assert.ok(attempts.body.attempts.some(attempt => attempt.provider === "http_fixture" && attempt.messageId === "flexible-provider-id"));
            const publicSettings = await request("/settings");
            assert.equal(publicSettings.body.settings.smsConfigurations, undefined);
            assert.equal(publicSettings.body.settings.smsProviders, undefined);
            assert.equal((await save({ smsProvider: "http_fixture", smsConfiguration: { url: "https://other.example.test" } })).status, 400);
        } finally {
            if (original === undefined) delete process.env.SMS_HTTP_PROFILES_JSON;
            else process.env.SMS_HTTP_PROFILES_JSON = original;
        }
    });

    it("keeps authentication secrets out of login, profile, user-list and document serialization", async () => {
        assertSafe(customerAuth.body);
        assertSafe((await request(`/users/get/${customer._id}`, { cookie: customerAuth.cookie })).body);
        assertSafe((await request("/users/all", { cookie: adminAuth.cookie })).body);
        const unverified = await db.getLocalUserModel().create({ name: "OTP test", email: "otp@example.test",
            password: "local-test-password", phoneVerificationOtp: "123456",
            phoneVerificationExpires: new Date(Date.now() + 60000) });
        assertSafe(unverified.toJSON());
        assertSafe(unverified.toObject());
        assert.equal((await db.getLocalUserModel().findById(unverified._id)).password, undefined);
        const verified = await request("/users/verify-phone", { method: "POST",
            body: { userId: String(unverified._id), otp: "123456" } });
        assert.equal(verified.status, 200);
        assertSafe(verified.body);
        assert.equal((await login(unverified)).status, 200);
    });

    it("limits order reads to the owner or an administrator and omits populated secrets", async () => {
        const item = await product();
        const created = await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie, body: orderPayload(item) });
        assert.equal(created.status, 201);
        const path = `/orders/${created.body.order._id}`;
        assert.equal((await request(path, { cookie: (await login(other)).cookie })).status, 404);
        const own = await request(path, { cookie: customerAuth.cookie });
        assert.equal(own.status, 200);
        assertSafe(own.body);
        const managed = await request(path, { cookie: adminAuth.cookie });
        assert.equal(managed.status, 200);
        assertSafe(managed.body);
    });

    it("protects every promotion management route and preserves public active offers", async () => {
        const item = await product();
        const data = { title: "Test offer", type: "OFFER", discountType: "PERCENTAGE", discountValue: 10,
            products: [String(item._id)], startTime: new Date(Date.now() - 60000).toISOString(),
            endTime: new Date(Date.now() + 86400000).toISOString() };
        const created = await request("/promotions", { method: "POST", cookie: adminAuth.cookie, body: data });
        assert.equal(created.status, 201);
        const id = created.body.promotion._id;
        for (const [method, path] of [["GET", "/promotions"], ["GET", `/promotions/${id}`],
            ["POST", "/promotions"], ["PUT", `/promotions/${id}`], ["DELETE", `/promotions/${id}`]]) {
            assert.equal((await request(path, { method, ...(method === "GET" ? {} : { body: data }) })).status, 401);
            assert.equal((await request(path, { method, cookie: customerAuth.cookie,
                ...(method === "GET" ? {} : { body: data }) })).status, 401);
        }
        assert.equal((await request("/promotions/active")).status, 200);
        assert.equal((await request(`/promotions/${id}`, { method: "PUT", cookie: adminAuth.cookie,
            body: { ...data, title: "Edited offer" } })).status, 200);
        assert.equal((await request(`/promotions/${id}`, { method: "DELETE", cookie: adminAuth.cookie })).status, 200);
    });

    it("forces customer payment and status defaults and derives fees from settings", async () => {
        const item = await product();
        const created = await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie,
            body: orderPayload(item, { taxAmount: 0, shippingFee: 0, shippingMethod: "pickup", status: "delivered",
                payment: { method: "COD", ispaid: true }, userId: String(admin._id) }) });
        assert.equal(created.status, 201);
        const order = created.body.order;
        assert.equal(order.userId, String(customer._id));
        assert.equal(order.status, "pending");
        assert.equal(order.payment.ispaid, false);
        assert.equal(order.taxAmount, 20);
        assert.equal(order.shippingFee, 150);
        assert.equal(order.shippingMethod, "standard");
        assert.equal(order.grandTotal, 270);
    });

    it("preserves authorized administrator manual-order fields", async () => {
        const item = await product();
        const created = await request("/orders/place-order", { method: "POST", cookie: adminAuth.cookie,
            body: orderPayload(item, { userId: String(other._id), taxAmount: 5, shippingFee: 25,
                status: "shipped", payment: { method: "COD", ispaid: true } }) });
        assert.equal(created.status, 201);
        assert.equal(created.body.order.userId, String(other._id));
        assert.equal(created.body.order.grandTotal, 130);
        assert.equal(created.body.order.payment.ispaid, true);
        assert.equal(created.body.order.status, "shipped");
    });

    it("rejects invalid charges, quantities and payment methods without changing stock", async () => {
        const item = await product(10);
        for (const extra of [{ shippingFee: -1 }, { taxAmount: "Infinity" }, { payment: { method: "disabled" } },
            { shippingFee: [] }, { items: [{ product: String(item._id), quantity: true }] },
            { items: [{ product: String(item._id), quantity: 0.5 }] },
            { items: [{ product: String(item._id), quantity: "Infinity" }] }]) {
            assert.equal((await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie,
                body: orderPayload(item, extra) })).status, 400);
        }
        assert.equal((await db.getLocalProductModel().findById(item._id)).stock, 10);
        assert.equal(await db.getLocalOrderModel().countDocuments({ "items.product": item._id }), 0);
    });

    it("combines duplicate lines before checking and decrementing stock", async () => {
        const item = await product(3);
        const lines = (quantity) => Array.from({ length: 2 }, () => ({ product: String(item._id), quantity }));
        assert.equal((await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie,
            body: orderPayload(item, { items: lines(2) }) })).status, 400);
        const valid = await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie,
            body: orderPayload(item, { items: lines(1) }) });
        assert.equal(valid.status, 201);
        assert.equal(valid.body.order.items.length, 1);
        assert.equal(valid.body.order.items[0].quantity, 2);
        assert.equal((await db.getLocalProductModel().findById(item._id)).stock, 1);
    });

    it("rolls inventory back if order persistence fails after stock updates", async () => {
        const item = await product(3);
        const Model = db.getLocalOrderModel();
        const save = Model.prototype.save;
        Model.prototype.save = function (...args) {
            if (this.recipient.name === "Forced rollback") throw new Error("Forced order insert failure");
            return save.apply(this, args);
        };
        try {
            const body = orderPayload(item);
            body.recipient.name = "Forced rollback";
            assert.equal((await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie, body })).status, 500);
        } finally { Model.prototype.save = save; }
        const remaining = await db.getLocalProductModel().findById(item._id);
        assert.equal(remaining.stock, 3);
        assert.equal(remaining.sold, 0);
        assert.equal(await Model.countDocuments({ "items.product": item._id }), 0);
    });

    it("allows only one competing checkout to buy the last unit", async () => {
        const item = await product(1);
        const outcomes = await Promise.all([1, 2].map(() => request("/orders/place-order", {
            method: "POST", cookie: customerAuth.cookie, body: orderPayload(item) })));
        assert.deepEqual(outcomes.map((result) => result.status).sort(), [201, 400]);
        const remaining = await db.getLocalProductModel().findById(item._id);
        assert.equal(remaining.stock, 0);
        assert.equal(remaining.sold, 1);
        assert.equal(await db.getLocalOrderModel().countDocuments({ "items.product": item._id }), 1);
    });

    it("rejects unauthenticated and expired socket connections", async () => {
        await assert.rejects(socket(), /Authentication required/);
        const expired = jwt.sign({ id: String(customer._id) }, process.env.JWT_ACCESS_SECRET, { expiresIn: -1 });
        await assert.rejects(socket(`accessToken=${expired}`), /Authentication required/);
    });

    it("uses verified socket identities for rooms and permits administrator subscriptions", async () => {
        const client = await socket(customerAuth.cookie);
        assert.deepEqual(await acknowledgement(client, "join_admin"), { success: false });
        assert.deepEqual(await acknowledgement(client, "join_user", String(other._id)), { success: false });
        assert.deepEqual(await acknowledgement(client, "join_user", String(customer._id)), { success: true });
        const rooms = getIO().sockets.sockets.get(client.id).rooms;
        assert.ok(rooms.has(`user_${customer._id}`));
        assert.ok(!rooms.has("admin_room"));
        assert.ok(!rooms.has(`user_${other._id}`));
        const staff = await socket(adminAuth.cookie);
        assert.deepEqual(await acknowledgement(staff, "join_admin"), { success: true });
        assert.ok(getIO().sockets.sockets.get(staff.id).rooms.has("admin_room"));
    });

    it("retains every address and zero coordinates, allows clearing, and rejects invalid coordinates", async () => {
        const path = `/users/update/${customer._id}`;
        const addresses = [{ street: "First", lat: 0, lng: 0 }, { street: "Second", city: "Bannu", lat: 32.99, lng: 70.6 }];
        const saved = await request(path, { method: "PUT", cookie: customerAuth.cookie, body: { addresses } });
        assert.equal(saved.status, 200);
        assert.equal(saved.body.user.addresses.length, 2);
        assert.equal(saved.body.user.addresses[0].lat, 0);
        assert.equal(saved.body.user.addresses[0].lng, 0);
        assert.equal(saved.body.user.addresses[1].lat, 32.99);
        for (const invalid of [[{ lat: 91 }], [{ lng: -181 }], [{ lat: true }], "invalid"]) {
            assert.equal((await request(path, { method: "PUT", cookie: customerAuth.cookie, body: { addresses: invalid } })).status, 400);
        }
        assert.equal((await db.getLocalUserModel().findById(customer._id)).addresses.length, 2);
        const cleared = await request(path, { method: "PUT", cookie: customerAuth.cookie, body: { addresses: [] } });
        assert.equal(cleared.status, 200);
        assert.deepEqual(cleared.body.user.addresses, []);
    });

    it("filters products by category ID, exact name, legacy label, and descendants", async () => {
        const item = await product();
        const Category = db.getLocalCategoryModel();
        const parent = await Category.create({ name: "personal care" });
        const child = await Category.create({ name: "skin test", parentId: parent._id });
        await db.getLocalProductModel().updateOne({ _id: item._id }, { category: child._id });
        for (const category of [String(parent._id), String(child._id), "personal care", "Personal"]) {
            const result = await request(`/products/all?category=${encodeURIComponent(category)}`);
            assert.equal(result.status, 200);
            assert.deepEqual(result.body.products.map(p => p._id), [String(item._id)]);
        }
        const unknown = await request("/products/all?category=does-not-exist");
        assert.equal(unknown.status, 200);
        assert.equal(unknown.body.products.length, 0);
    });

    it("returns actual catalog review counts and averages without fabricated ratings", async () => {
        const item = await product();
        const path = `/products/all?category=${item.category}`;
        const empty = await request(path);
        assert.equal(empty.body.products[0].reviewCount, 0);
        assert.equal(empty.body.products[0].averageRating, 0);
        await db.getLocalReviewModel().create({ user: customer._id, product: item._id,
            name: "Test reviewer", rating: 4, comment: "Synthetic regression review" });
        await db.getLocalReviewModel().create({ user: other._id, product: item._id,
            name: "Second reviewer", rating: 5, comment: "Synthetic regression review" });
        const rated = await request(path);
        assert.equal(rated.body.products[0].reviewCount, 2);
        assert.equal(rated.body.products[0].averageRating, 4.5);
        assert.equal(rated.body.products[0].price, 100);
    });

    it("reports paid non-cancelled revenue, real period trends, and per-product low-stock thresholds", async () => {
        const item = await product(10);
        await db.getLocalProductModel().updateOne({ _id: item._id }, { lowStock: 20 });
        const healthy = await product(6);
        await db.getLocalProductModel().updateOne({ _id: healthy._id }, { lowStock: 2 });
        const legacy = await product(4);
        await db.getLocalProductModel().collection.updateOne({ _id: legacy._id }, { $unset: { lowStock: "" } });
        const disabled = await product(1);
        await db.getLocalProductModel().updateOne({ _id: disabled._id }, { lowStock: 0 });
        const Order = db.getLocalOrderModel();
        for (const [day, amount, paid, status, isDeleted] of [
            [10, 200, true, "delivered", false], [10, 700, false, "pending", false],
            [10, 800, true, "cancelled", false], [10, 900, true, "delivered", true],
            [9, 100, true, "delivered", false],
        ]) await Order.create({ ...orderPayload(item), userId: customer._id,
            items: [{ product: item._id, quantity: 1, price: amount, totalAmount: amount }],
            grandTotal: amount, payment: { method: "COD", ispaid: paid }, status, isDeleted,
            createdAt: new Date(`2028-01-${String(day).padStart(2, "0")}T12:00:00.000Z`) });
        const response = await request("/orders/dashboard-stats?startDate=2028-01-10T00:00:00.000Z&endDate=2028-01-10T23:59:59.999Z", { cookie: adminAuth.cookie });
        assert.equal(response.status, 200);
        const stats = response.body.stats;
        assert.equal(stats.totalSales, 200);
        assert.equal(stats.totalOrders, 3);
        assert.equal(stats.averageOrderValue, 450);
        assert.equal(stats.trends.revenue, 100);
        assert.equal(stats.trends.orders, 200);
        assert.equal(stats.dailySales.reduce((total, day) => total + day.total, 0), 200);
        const low = stats.inventory.lowStock.map(p => p._id);
        assert.ok(low.includes(String(item._id)));
        assert.ok(low.includes(String(legacy._id)));
        assert.ok(!low.includes(String(healthy._id)));
        assert.ok(!low.includes(String(disabled._id)));
        assert.equal((await request("/orders/dashboard-stats?startDate=invalid", { cookie: adminAuth.cookie })).status, 400);
    });

    it("reports failed SMS delivery honestly and keeps verification recoverable without replacing a valid code", async () => {
        const registration = await request("/users/register", { method: "POST", body: {
            name: "Pending SMS", email: "pending-sms@example.test", phone: "03001234567", password: "local-test-password",
        } });
        assert.equal(registration.status, 201);
        assert.equal(registration.body.smsSent, false);
        assert.equal(registration.body.verificationRequired, true);
        assert.match(registration.body.message, /could not be sent/);
        const userId = registration.body.userId;
        const pending = await db.getLocalUserModel().findById(userId).select("+phoneVerificationOtp");
        await db.getLocalUserModel().updateOne({ _id: userId }, { $set: { phoneVerificationLastSentAt: new Date(Date.now() - 61000) } });
        const resend = await request("/users/resend-otp", { method: "POST", body: { userId } });
        assert.equal(resend.status, 503);
        assert.equal(resend.body.success, false);
        assert.equal(resend.body.smsSent, false);
        assert.equal((await db.getLocalUserModel().findById(userId).select("+phoneVerificationOtp")).phoneVerificationOtp, pending.phoneVerificationOtp);
        const loginResult = await request("/users/login", { method: "POST", body: { email: "pending-sms@example.test", password: "local-test-password" } });
        assert.equal(loginResult.body.userId, userId);
        assertSafe(registration.body);
    });

    it("reports successful OTP delivery and allows verification after a successful resend", async () => {
        const nativeFetch = globalThis.fetch;
        process.env.SMS_GATE_USERNAME = "test-only";
        process.env.SMS_GATE_PASSWORD = "test-only";
        let code, sends = 0;
        globalThis.fetch = async (url, options) => {
            if (String(url).startsWith(base)) return nativeFetch(url, options);
            assert.equal(String(url), "https://api.sms-gate.app/3rdparty/v1/messages");
            const message = JSON.parse(options.body).textMessage.text;
            code = message.match(/\b\d{6}\b/)[0];
            sends++;
            return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
        };
        try {
            const registration = await request("/users/register", { method: "POST", body: {
                name: "Delivered SMS", email: "delivered-sms@example.test", phone: "03001234568", password: "local-test-password",
            } });
            assert.equal(registration.status, 201);
            assert.equal(registration.body.smsSent, true);
            const userId = registration.body.userId;
            await db.getLocalUserModel().updateOne({ _id: userId }, { $set: { phoneVerificationLastSentAt: new Date(Date.now() - 61000) } });
            const resent = await request("/users/resend-otp", { method: "POST", body: { userId } });
            assert.equal(resent.status, 200);
            assert.equal(resent.body.smsSent, true);
            const verified = await request("/users/verify-phone", { method: "POST", body: { userId, otp: code } });
            assert.equal(verified.status, 200);
            assert.equal(verified.body.user.isPhoneVerified, true);
            assert.equal(sends, 2);
        } finally {
            globalThis.fetch = nativeFetch;
            process.env.SMS_GATE_USERNAME = "";
            process.env.SMS_GATE_PASSWORD = "";
        }
    });


    it("restores inventory exactly once under concurrent cancellation and records refunds idempotently", async () => {
        const item = await product(10);
        const created = await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie, body: orderPayload(item) });
        const id = created.body.order._id;
        assert.equal((await request(`/orders/payment/${id}`, { method: "PATCH", cookie: adminAuth.cookie, body: { ispaid: "false" } })).status, 400);
        assert.equal((await request(`/orders/payment/${id}`, { method: "PATCH", cookie: adminAuth.cookie, body: { ispaid: true } })).status, 200);
        const cancelled = await Promise.all(Array.from({ length: 4 }, () => request(`/orders/${id}/cancel`, { method: "PUT", cookie: customerAuth.cookie, body: {} })));
        assert.ok(cancelled.every(result => result.status === 200));
        const storedProduct = await db.getLocalProductModel().findById(item._id);
        assert.equal(storedProduct.stock, 10);
        assert.equal(storedProduct.sold, 0);
        const storedOrder = await db.getLocalOrderModel().findById(id);
        assert.equal(storedOrder.grandTotal, 0);
        assert.equal(storedOrder.payment.ispaid, true);
        assert.equal(storedOrder.refundDue, created.body.order.grandTotal);
        assert.equal((await request(`/orders/delete/${id}`, { method: "DELETE", cookie: adminAuth.cookie })).status, 409);
        const refund = { amount: storedOrder.refundDue, reference: "synthetic-refund-1" };
        for (let n = 0; n < 2; n++) assert.equal((await request(`/orders/${id}/refunds`, { method: "POST", cookie: adminAuth.cookie, body: refund })).status, 200);
        assert.equal((await db.getLocalOrderModel().findById(id)).refunds.length, 1);
        assert.equal((await request(`/orders/${id}/refunds`, { method: "POST", cookie: adminAuth.cookie, body: { amount: 1, reference: "over-refund" } })).status, 409);
        assert.equal((await request(`/orders/update/${id}`, { method: "PATCH", cookie: adminAuth.cookie, body: { status: "pending" } })).status, 409);
    });

    it("enforces transitions and rolls back inventory restoration when an item is missing", async () => {
        const item = await product(10), second = await product(10);
        const created = await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie,
            body: orderPayload(item, { items: [{ product: String(item._id), quantity: 1 }, { product: String(second._id), quantity: 1 }] }) });
        const id = created.body.order._id;
        await db.getLocalProductModel().deleteOne({ _id: second._id });
        assert.equal((await request(`/orders/${id}/cancel`, { method: "PUT", cookie: customerAuth.cookie, body: {} })).status, 409);
        assert.equal((await db.getLocalProductModel().findById(item._id)).stock, 9);
        assert.equal((await db.getLocalOrderModel().findById(id)).status, "pending");
        for (const [status, expected] of [["delivered", 409], ["shipped", 200], ["pending", 409], ["delivered", 200]])
            assert.equal((await request(`/orders/update/${id}`, { method: "PATCH", cookie: adminAuth.cookie, body: { status } })).status, expected);
        assert.equal((await request(`/orders/${id}/items/${created.body.order.items[0]._id}/cancel`, { method: "PUT", cookie: adminAuth.cookie, body: {} })).status, 409);
    });

    it("keeps partial cancellation totals and refunds consistent when the last item is cancelled", async () => {
        const first = await product(10), second = await product(10);
        const created = await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie, body: orderPayload(first, { items: [{ product: String(first._id), quantity: 1 }, { product: String(second._id), quantity: 1 }] }) });
        const id = created.body.order._id, total = created.body.order.grandTotal;
        await request(`/orders/payment/${id}`, { method: "PATCH", cookie: adminAuth.cookie, body: { ispaid: true } });
        for (const [index, item] of created.body.order.items.entries()) {
            const response = await request(`/orders/${id}/items/${item._id}/cancel`, { method: "PUT", cookie: adminAuth.cookie, body: {} });
            assert.equal(response.status, 200);
            assert.equal(response.body.order.grandTotal, index === 0 ? total - item.totalAmount : 0);
            assert.equal(response.body.order.refundDue, index === 0 ? item.totalAmount : total);
        }
        assert.equal((await db.getLocalOrderModel().findById(id)).status, "cancelled");
    });

    it("limits OTP guesses, resend cooldown, and login attempts", async () => {
        const user = await db.getLocalUserModel().create({ name: "OTP limit", email: "otp-limit@example.test", password: "local-test-password", phone: "03000000007",
            phoneVerificationOtp: "123456", phoneVerificationExpires: new Date(Date.now() + 600000), phoneVerificationLastSentAt: new Date() });
        const userId = String(user._id);
        assert.equal((await request("/users/resend-otp", { method: "POST", body: { userId } })).status, 429);
        for (let n = 0; n < 5; n++) assert.equal((await request("/users/verify-phone", { method: "POST", body: { userId, otp: "999999" } })).status, 400);
        assert.equal((await request("/users/verify-phone", { method: "POST", body: { userId, otp: "123456" } })).status, 400);
        for (let n = 0; n < 10; n++) await request("/users/login", { method: "POST", body: { email: "nonexistent-limit@example.test", password: "incorrect" } });
        assert.equal((await request("/users/login", { method: "POST", body: { email: "nonexistent-limit@example.test", password: "incorrect" } })).status, 429);
        const crossSite = await fetch(base + "/api/users/login", { method: "POST", headers: { Origin: "https://untrusted.example", "Content-Type": "application/json" }, body: "{}" });
        assert.equal(crossSite.status, 403);
    });


    it("deduplicates concurrent checkout and rejects a changed payload with the same key", async () => {
        const item = await product(1), key = randomUUID(), body = orderPayload(item);
        const replies = await Promise.all(Array.from({ length: 4 }, () => request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie, key, body })));
        assert.ok(replies.every(reply => [200, 201].includes(reply.status)), JSON.stringify(replies));
        assert.equal(new Set(replies.map(reply => reply.body.order._id)).size, 1);
        assert.equal((await db.getLocalProductModel().findById(item._id)).stock, 0);
        assert.equal((await db.getLocalProductModel().findById(item._id)).sold, 1);
        assert.equal((await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie, key, body: { ...body, recipient: { ...body.recipient, name: "Changed" } } })).status, 409);
        const noKey = await fetch(base + "/api/orders/place-order", { method: "POST", headers: { "Content-Type": "application/json", cookie: customerAuth.cookie }, body: JSON.stringify(body) });
        assert.equal(noKey.status, 400);
    });

    it("denies customer and anonymous access across administration endpoints", async () => {
        const id = String(admin._id);
        const routes = [
            ["POST", "/categories/create"], ["PATCH", `/categories/update/${id}`], ["DELETE", `/categories/delete/${id}`],
            ["POST", "/products/create"], ["PATCH", `/products/update/${id}`], ["DELETE", `/products/delete/${id}`],
            ["POST", "/hero"], ["PUT", `/hero/${id}`], ["DELETE", `/hero/${id}`],
            ["PUT", "/homepage"], ["DELETE", "/homepage/reset"], ["POST", "/homepage/upload-image"],
            ["POST", "/menus"], ["PUT", `/menus/${id}`], ["DELETE", `/menus/${id}`],
            ["GET", "/orders/get-all"], ["PATCH", `/orders/payment/${id}`], ["POST", `/orders/${id}/refunds`],
            ["GET", "/prescriptions"], ["PUT", `/prescriptions/${id}/status`], ["DELETE", `/prescriptions/${id}`],
            ["GET", "/promotions"], ["POST", "/promotions"], ["PUT", `/promotions/${id}`],
            ["GET", "/settings/admin"], ["PUT", "/settings"], ["POST", "/settings/sms/test"],
            ["GET", "/sms-templates"], ["POST", "/sms-templates/seed"],
            ["POST", "/staff"], ["PUT", `/staff/${id}`], ["DELETE", `/staff/${id}`],
            ["GET", "/users/all"], ["POST", "/users/add"],
            ["POST", "/vendors"], ["POST", "/vendors/upload-image"], ["PUT", `/vendors/${id}`], ["DELETE", `/vendors/${id}`],
        ];
        for (const [method, path] of routes) for (const cookie of [undefined, customerAuth.cookie]) {
            const response = await request(path, { method, cookie, ...(method === "GET" ? {} : { body: {} }) });
            assert.ok([401, 403].includes(response.status), `${method} ${path}: ${response.status}`);
        }
        assert.equal((await request(`/users/get/${other._id}`, { cookie: customerAuth.cookie })).status, 403);
        assert.equal((await request(`/users/update/${other._id}`, { method: "PUT", cookie: customerAuth.cookie, body: { role: "admin" } })).status, 403);
        const self = await request(`/users/update/${customer._id}`, { method: "PUT", cookie: customerAuth.cookie, body: { role: "admin", isPhoneVerified: true, sessionVersion: 999 } });
        assert.equal(self.status, 200);
        assert.equal((await db.getLocalUserModel().findById(customer._id)).role, "user");
        const Prescription = db.getLocalPrescriptionModel();
        const foreign = await Prescription.create({ userId: other._id, name: "Private", phone: "00000000000", address: { lat: 0, lng: 0 }, image: "/synthetic", imagekitFileId: "synthetic" });
        const own = await request("/prescriptions/my", { cookie: customerAuth.cookie });
        assert.ok(!own.body.prescriptions.some(prescription => prescription._id === String(foreign._id)));
    });

    it("round-trips encrypted backups with BSON types and indexes and refuses overwrite or tampering", async () => {
        const { createBackup, restoreBackup } = await import("../utils/databaseBackup.js");
        const source = db.getLocalUserModel().db.useDb("backup_fixture");
        const target = db.getLocalUserModel().db.useDb("restore_fixture");
        const collection = source.db.collection("sample");
        await collection.createIndex({ code: 1 }, { unique: true });
        await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        const when = new Date(), key = "ab".repeat(32);
        const inserted = await collection.insertOne({ code: "synthetic", when });
        const bytes = await createBackup(source, key);
        assert.ok(!bytes.includes(Buffer.from("synthetic")));
        const tampered = Buffer.from(bytes); tampered[tampered.length - 1] ^= 1;
        await assert.rejects(() => restoreBackup(target, tampered, key));
        assert.equal(await restoreBackup(target, bytes, key), 1);
        const restored = await target.db.collection("sample").findOne({ _id: inserted.insertedId });
        assert.equal(restored.when.getTime(), when.getTime());
        await assert.rejects(() => target.db.collection("sample").insertOne({ code: "synthetic" }), error => error.code === 11000);
        await assert.rejects(() => restoreBackup(target, bytes, key), /empty dedicated database/);
    });


    it("preserves settings on partial saves and rejects invalid shipping values atomically", async () => {
        assert.equal((await request("/settings", { method: "PUT", cookie: adminAuth.cookie, body: { shippingMethod: "express" } })).status, 200);
        let settings = await db.getLocalSettingsModel().findOne();
        assert.equal(settings.taxAmount, 20); assert.equal(settings.shippingFee, 150);
        for (const body of [{ taxAmount: -1 }, { shippingFee: "not-a-number" }, { advancedShipping: { distanceRatePerKm: -1 } }])
            assert.equal((await request("/settings", { method: "PUT", cookie: adminAuth.cookie, body })).status, 400);
        settings = await db.getLocalSettingsModel().findOne();
        assert.equal(settings.taxAmount, 20); assert.equal(settings.shippingFee, 150);
    });

    it("supports zero-stock admin products and validates edits without altering sales counters", async () => {
        const { getImageKit } = await import("../config/imagekit.js");
        const sharp = (await import("sharp")).default;
        const savedEnv = [process.env.IMAGEKIT_PUBLIC_KEY, process.env.IMAGEKIT_PRIVATE_KEY, process.env.IMAGEKIT_URL_ENDPOINT];
        process.env.IMAGEKIT_PUBLIC_KEY = "synthetic-public"; process.env.IMAGEKIT_PRIVATE_KEY = "synthetic-private"; process.env.IMAGEKIT_URL_ENDPOINT = "https://example.test";
        const files = getImageKit().files, upload = files.upload;
        files.upload = async () => ({ fileId: "synthetic", url: "https://example.test/image.webp", filePath: "/image.webp", name: "image.webp" });
        try {
            const category = await db.getLocalCategoryModel().create({ name: `zero-stock-${++number}` });
            const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).png().toBuffer();
            const form = new FormData();
            form.set("data", JSON.stringify({ name: `Zero stock ${number}`, category: String(category._id), price: 0, stock: 0, lowStock: 0, minPrice: "", maxPrice: "", vendor: "" }));
            form.append("images", new Blob([png], { type: "image/png" }), "test.png");
            const created = await fetch(base + "/api/products/create", { method: "POST", headers: { cookie: adminAuth.cookie }, body: form });
            assert.equal(created.status, 201);
            const id = (await created.json()).product._id;
            let uploadCalls = 0;
            files.upload = async () => { uploadCalls++; throw new Error("Must not upload invalid input"); };
            const invalidForm = new FormData();
            invalidForm.set("data", JSON.stringify({ stock: -1 }));
            invalidForm.append("images", new Blob([png], { type: "image/png" }), "invalid.png");
            const rejected = await fetch(base + `/api/products/update/${id}`, { method: "PATCH", headers: { cookie: adminAuth.cookie }, body: invalidForm });
            assert.equal(rejected.status, 400); assert.equal(uploadCalls, 0);
            for (const fields of [{ stock: -1 }, { stock: 1.5 }, { price: -2 }, { images: "bad" }])
                assert.equal((await request(`/products/update/${id}`, { method: "PATCH", cookie: adminAuth.cookie, body: { data: JSON.stringify(fields) } })).status, 400);
            const edited = await request(`/products/update/${id}`, { method: "PATCH", cookie: adminAuth.cookie, body: { data: JSON.stringify({ stock: 5, sold: 999, price: 10 }) } });
            assert.equal(edited.status, 200); assert.equal(edited.body.product.stock, 5); assert.equal(edited.body.product.sold, 0);
            for (const variant of [{ name: "Bad", price: -1, stock: 1 }, { name: "Bad", price: 5, stock: 0.5 }, { name: "Bad", price: "", stock: 1 }]) {
                const rejectedVariant = await request(`/products/update/${id}`, { method: "PATCH", cookie: adminAuth.cookie, body: { data: JSON.stringify({ variants: [variant] }) } });
                assert.equal(rejectedVariant.status, 400);
            }
            const variantEdit = await request(`/products/update/${id}`, { method: "PATCH", cookie: adminAuth.cookie, body: { data: JSON.stringify({ variants: [{ name: "Small", price: 10, stock: 2 }, { name: "Large", price: 20, stock: 3 }] }) } });
            assert.equal(variantEdit.status, 200); assert.equal(variantEdit.body.product.stock, 5); assert.equal(variantEdit.body.product.price, 10); assert.equal(variantEdit.body.product.variants.length, 2); assert.equal(variantEdit.body.product.hasVariants, true);
            assert.equal((await request("/products/create", { method: "POST", cookie: adminAuth.cookie, body: {} })).status, 400);
            assert.equal((await request("/products/all?limit=0")).status, 400);
            assert.equal((await request("/products/all?page=-1")).status, 400);
        } finally {
            files.upload = upload;
            for (const [index, key] of ["IMAGEKIT_PUBLIC_KEY", "IMAGEKIT_PRIVATE_KEY", "IMAGEKIT_URL_ENDPOINT"].entries()) {
                if (savedEnv[index] === undefined) delete process.env[key]; else process.env[key] = savedEnv[index];
            }
        }
    });

    it("handles admin prescription processing and rejects invalid statuses without saving", async () => {
        const Model = db.getLocalPrescriptionModel();
        const prescription = await Model.create({ userId: customer._id, name: "Synthetic", phone: "00000000000", address: { lat: 0, lng: 0 }, image: "/test", imagekitFileId: "test" });
        for (const status of ["processing", "completed"]) {
            const response = await request(`/prescriptions/${prescription._id}/status`, { method: "PUT", cookie: adminAuth.cookie, body: { status } });
            assert.equal(response.status, 200); assert.equal(response.body.prescription.status, status);
        }
        assert.equal((await request(`/prescriptions/${prescription._id}/status`, { method: "PUT", cookie: adminAuth.cookie, body: { status: "invalid" } })).status, 400);
        assert.equal((await Model.findById(prescription._id)).status, "completed");
        assert.equal((await request(`/prescriptions/${prescription._id}/mark-viewed`, { method: "PUT", cookie: adminAuth.cookie, body: {} })).status, 200);
    });

    it("refreshes an expired access token but rejects expired or revoked refresh tokens", async () => {
        const { generateToken } = await import("../utils/jwt.js");
        const access = generateToken(customer, -1, process.env.JWT_ACCESS_SECRET);
        const refresh = generateToken(customer, "1h", process.env.JWT_REFRESH_SECRET);
        const expired = generateToken(customer, -1, process.env.JWT_REFRESH_SECRET);
        assert.equal((await request("/orders/my-orders", { cookie: `accessToken=${access}; refreshToken=${refresh}` })).status, 200);
        assert.equal((await request("/orders/my-orders", { cookie: `accessToken=${access}; refreshToken=${expired}` })).status, 401);
        assert.equal((await request("/users/getAccessToken", { cookie: `refreshToken=${expired}` })).status, 401);
        const revoked = generateToken({ ...customer.toObject(), sessionVersion: 123 }, "1h", process.env.JWT_REFRESH_SECRET);
        assert.equal((await request("/users/getAccessToken", { cookie: `refreshToken=${revoked}` })).status, 401);
    });

    it("supports vendor admin CRUD and returns a client error for malformed IDs", async () => {
        const created = await request("/vendors", { method: "POST", cookie: adminAuth.cookie, body: { name: `Vendor ${++number}` } });
        assert.equal(created.status, 201);
        const id = created.body.vendor._id;
        const edited = await request(`/vendors/${id}`, { method: "PUT", cookie: adminAuth.cookie, body: { description: "Updated" } });
        assert.equal(edited.status, 200); assert.equal(edited.body.vendor.description, "Updated");
        assert.equal((await request("/vendors/not-an-id", { method: "PUT", cookie: adminAuth.cookie, body: {} })).status, 400);
        assert.equal((await request(`/vendors/${id}`, { method: "DELETE", cookie: adminAuth.cookie })).status, 200);
        assert.equal((await request(`/vendors/${id}`, { method: "PUT", cookie: adminAuth.cookie, body: {} })).status, 404);
    });

    it("round-trips saved coordinates and rejects incomplete or out-of-range delivery locations", async () => {
        const addresses = [{ street: "Exact unit", city: "Town", lat: 0, lng: 0 }];
        const saved = await request(`/users/update/${customer._id}`, { method: "PUT", cookie: customerAuth.cookie, body: { addresses } });
        assert.equal(saved.status, 200);
        const loaded = await request(`/users/get/${customer._id}`, { cookie: customerAuth.cookie });
        assert.equal(loaded.body.user.addresses[0].street, "Exact unit");
        assert.equal(loaded.body.user.addresses[0].lat, 0); assert.equal(loaded.body.user.addresses[0].lng, 0);
        assert.equal((await request(`/users/update/${customer._id}`, { method: "PUT", cookie: customerAuth.cookie, body: { addresses: [{ street: "Bad", lat: 4 }] } })).status, 400);
        const item = await product(10);
        for (const coords of [{ lat: 99, lng: 0 }, { lat: 1 }, { lat: true, lng: 0 }]) {
            const body = orderPayload(item); Object.assign(body.recipient, coords);
            assert.equal((await request("/orders/place-order", { method: "POST", cookie: customerAuth.cookie, body })).status, 400);
        }
        for (const coords of [{ address_lat: "91", address_lng: "0" }, { address_lat: "12bad", address_lng: "0" }, { address_lat: "0" }])
            assert.equal((await request("/prescriptions", { method: "POST", cookie: customerAuth.cookie, body: coords })).status, 400);
        assert.equal((await request("/settings", { method: "PUT", cookie: adminAuth.cookie, body: { advancedShipping: { storeLocation: { lat: 91, lng: 0 } } } })).status, 400);
    });

    it("completes a customer journey through OTP, profile, search, wishlist, checkout, review, cancellation and logout", async () => {
        const nativeFetch = globalThis.fetch;
        process.env.SMS_GATE_USERNAME = "test-only"; process.env.SMS_GATE_PASSWORD = "test-only";
        let otp;
        globalThis.fetch = async (url, options) => {
            if (String(url).startsWith(base)) return nativeFetch(url, options);
            assert.equal(String(url), "https://api.sms-gate.app/3rdparty/v1/messages");
            const text = JSON.parse(options.body).textMessage.text;
            const match = text.match(/\b\d{6}\b/); if (match) otp = match[0];
            return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
        };
        try {
            const credentials = { name: "Journey customer", email: "journey@example.test", phone: "03001234991", password: "local-test-password" };
            const registered = await request("/users/register", { method: "POST", body: credentials });
            assert.equal(registered.status, 201); assert.equal(registered.body.smsSent, true);
            assert.equal((await request("/users/login", { method: "POST", body: credentials })).status, 403);
            const verified = await request("/users/verify-phone", { method: "POST", body: { userId: registered.body.userId, otp } });
            assert.equal(verified.status, 200); assertSafe(verified.body);
            const cookie = verified.cookie;
            assert.equal((await request("/users/verify-phone", { method: "POST", body: { userId: registered.body.userId, otp } })).status, 400);
            const address = { street: "Unit 7", city: "Bannu", country: "Pakistan", lat: 32.99, lng: 70.6 };
            assert.equal((await request(`/users/update/${registered.body.userId}`, { method: "PUT", cookie, body: { addresses: [address] } })).status, 200);
            const profile = await request(`/users/get/${registered.body.userId}`, { cookie });
            assert.equal(profile.body.user.addresses[0].street, address.street);
            const item = await product(4);
            const results = await request(`/products/all?search=${encodeURIComponent(item.name)}`);
            assert.ok(results.body.products.some(entry => entry._id === String(item._id)));
            const wishes = await Promise.all(Array.from({ length: 4 }, () => request("/users/wishlist/add", { method: "POST", cookie, body: { productId: String(item._id) } })));
            assert.ok(wishes.every(result => result.status === 200));
            assert.equal((await request("/users/wishlist", { cookie })).body.wishlist.length, 1);
            const key = randomUUID(), payload = orderPayload(item, { recipient: { ...address, name: credentials.name, phone: credentials.phone } });
            const placed = await request("/orders/place-order", { method: "POST", cookie, key, body: payload });
            assert.equal(placed.status, 201);
            const replay = await request("/orders/place-order", { method: "POST", cookie, key, body: payload });
            assert.equal(replay.body.order._id, placed.body.order._id);
            const orders = await request("/orders/my-orders", { cookie });
            assert.equal(orders.body.orders.length, 1); assertSafe(orders.body);
            assert.equal((await request("/reviews", { method: "POST", cookie, body: { productId: String(item._id), rating: 5, comment: "Synthetic review" } })).status, 201);
            assert.equal((await request("/reviews", { method: "POST", cookie, body: { productId: String(item._id), rating: 5, comment: "Duplicate" } })).status, 400);
            assert.equal((await request(`/orders/${placed.body.order._id}/cancel`, { method: "PUT", cookie, body: { reason: "Changed mind" } })).status, 200);
            assert.equal((await db.getLocalProductModel().findById(item._id)).stock, 4);
            assert.equal((await request(`/users/wishlist/remove/${item._id}`, { method: "DELETE", cookie })).body.wishlist.length, 0);
            assert.equal((await request("/users/logout", { method: "POST", cookie })).status, 200);
            assert.equal((await request("/orders/my-orders", { cookie })).status, 401);
            assert.equal((await request("/users/login", { method: "POST", body: credentials })).status, 200);
        } finally { globalThis.fetch = nativeFetch; process.env.SMS_GATE_USERNAME = ""; process.env.SMS_GATE_PASSWORD = ""; }
    });

    it("allows a customer prescription upload and isolates it from other customers", async () => {
        const { getImageKit } = await import("../config/imagekit.js");
        const files = getImageKit().files, original = files.upload;
        const sharp = (await import("sharp")).default;
        files.upload = async () => ({ fileId: "customer-prescription", url: "https://example.test/prescription.webp", filePath: "/prescription.webp" });
        try {
            const buffer = await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).png().toBuffer();
            const form = new FormData();
            form.set("name", "Prescription customer"); form.set("phone", "00000000000"); form.set("address_text", "Exact address"); form.set("address_lat", "0"); form.set("address_lng", "0");
            form.append("image", new Blob([buffer], { type: "image/png" }), "prescription.png");
            const response = await fetch(base + "/api/prescriptions", { method: "POST", headers: { cookie: customerAuth.cookie }, body: form });
            assert.equal(response.status, 201);
            const created = (await response.json()).prescription;
            assert.equal(created.address.lat, 0); assert.equal(created.userId, String(customer._id));
            assert.ok((await request("/prescriptions/my", { cookie: customerAuth.cookie })).body.prescriptions.some(entry => entry._id === created._id));
            const otherSession = await login(other);
            assert.ok(!(await request("/prescriptions/my", { cookie: otherSession.cookie })).body.prescriptions.some(entry => entry._id === created._id));
        } finally { files.upload = original; }
    });

    it("disconnects subscriptions on logout", async () => {
        const client = await socket(customerAuth.cookie);
        const disconnected = once(client, "disconnect");
        assert.equal((await request("/users/logout", { method: "POST", cookie: customerAuth.cookie })).status, 200);
        await disconnected;
        assert.equal(client.connected, false);
        assert.equal((await request("/orders/my-orders", { cookie: customerAuth.cookie })).status, 401);
        const fresh = await login(customer);
        assert.equal((await request("/orders/my-orders", { cookie: fresh.cookie })).status, 200);
    });
});
