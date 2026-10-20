import { it } from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../middlewares/ErrorHandler.js";
import { securityConfigIssues } from "../utils/securityConfig.js";

it("redacts internal errors from responses and logs", () => {
    const original = console.error, logs = [];
    console.error = value => logs.push(value);
    try {
        const res = { status(value) { this.code = value; return this; }, json(value) { this.body = value; return this; } };
        errorHandler(new Error("mongodb://user:synthetic-secret@private-host patient-phone"), {}, res, () => {});
        assert.equal(res.code, 500);
        assert.ok(res.body.requestId);
        assert.doesNotMatch(JSON.stringify({ logs, body: res.body }), /synthetic-secret|private-host|patient-phone/);
        errorHandler(Object.assign(new Error("private input"), { name: "CastError" }), {}, res, () => {});
        assert.equal(res.code, 400);
        assert.doesNotMatch(JSON.stringify(res.body), /private input/);
    } finally { console.error = original; }
});

it("rejects weak production configuration without printing secret values", () => {
    assert.ok(securityConfigIssues({}).length >= 4);
    const env = { JWT_ACCESS_SECRET: "a".repeat(64), JWT_REFRESH_SECRET: "b".repeat(64), ENCRYPTION_KEY: "c".repeat(32), FRONTEND_URL: "https://shop.example.com", MONGO_URI_ONLINE: "mongodb://localhost" };
    assert.deepEqual(securityConfigIssues(env), []);
    assert.ok(securityConfigIssues({ ...env, JWT_REFRESH_SECRET: env.JWT_ACCESS_SECRET }).some(issue => issue.includes("differ")));
    assert.ok(securityConfigIssues({ ...env, FRONTEND_URL: "https://shop.example.com/path" }).length);
});
