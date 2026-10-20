import { it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { encrypt, decrypt } from "../utils/encryption.js";
import { getImageKit } from "../config/imagekit.js";

it("requires a dedicated valid encryption key and detects ciphertext tampering", () => {
    const original = process.env.ENCRYPTION_KEY;
    try {
        delete process.env.ENCRYPTION_KEY;
        assert.throws(() => encrypt("synthetic"), /ENCRYPTION_KEY must be configured/);
        process.env.ENCRYPTION_KEY = "too-short";
        assert.throws(() => encrypt("synthetic"), /exactly 32/);
        process.env.ENCRYPTION_KEY = crypto.randomBytes(16).toString("hex");
        const encrypted = encrypt("synthetic-password");
        assert.match(encrypted, /^v2:/);
        assert.equal(decrypt(encrypted), "synthetic-password");
        assert.notEqual(encrypt("synthetic-password"), encrypted);
        const parts = encrypted.split(":");
        parts[2] = (parts[2][0] === "0" ? "1" : "0") + parts[2].slice(1);
        assert.equal(decrypt(parts.join(":")), null);
        process.env.ENCRYPTION_KEY = crypto.randomBytes(16).toString("hex");
        assert.equal(decrypt(encrypted), null);
    } finally {
        if (original === undefined) delete process.env.ENCRYPTION_KEY;
        else process.env.ENCRYPTION_KEY = original;
    }
});

it("reads legacy CBC only with an explicitly configured key and writes authenticated replacements", () => {
    const oldCurrent = process.env.ENCRYPTION_KEY;
    const oldLegacy = process.env.LEGACY_ENCRYPTION_KEY;
    try {
        const legacyKey = crypto.randomBytes(16).toString("hex");
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(legacyKey), iv);
        const stored = iv.toString("hex") + ":" + Buffer.concat([cipher.update("old-test-password"), cipher.final()]).toString("hex");
        process.env.ENCRYPTION_KEY = legacyKey;
        delete process.env.LEGACY_ENCRYPTION_KEY;
        assert.equal(decrypt(stored), "old-test-password");
        process.env.ENCRYPTION_KEY = crypto.randomBytes(16).toString("hex");
        process.env.LEGACY_ENCRYPTION_KEY = legacyKey;
        assert.equal(decrypt(stored), "old-test-password");
        const migrated = encrypt(decrypt(stored));
        delete process.env.LEGACY_ENCRYPTION_KEY;
        assert.equal(decrypt(migrated), "old-test-password");
    } finally {
        for (const [name, value] of [["ENCRYPTION_KEY", oldCurrent], ["LEGACY_ENCRYPTION_KEY", oldLegacy]]) {
            if (value === undefined) delete process.env[name];
            else process.env[name] = value;
        }
    }
});

it("fails image service operations locally when credentials are missing", () => {
    const original = process.env.IMAGEKIT_PRIVATE_KEY;
    try {
        delete process.env.IMAGEKIT_PRIVATE_KEY;
        assert.throws(() => getImageKit(), error => error.statusCode === 503 && /environment configuration/.test(error.message));
    } finally {
        if (original === undefined) delete process.env.IMAGEKIT_PRIVATE_KEY;
        else process.env.IMAGEKIT_PRIVATE_KEY = original;
    }
});
