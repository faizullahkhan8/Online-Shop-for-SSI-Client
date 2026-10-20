import { it } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { normalizeImage } from "../utils/safeImage.js";
import { safeContentTree } from "../utils/safeHtml.js";

it("rejects disguised SVG, mismatched MIME and corrupt image bytes", async () => {
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).png().toBuffer();
    for (const [buffer, mimetype] of [[Buffer.from('<svg onload="alert(1)"></svg>'), "image/png"], [png, "image/jpeg"], [Buffer.from("invalid"), "image/webp"]])
        await assert.rejects(() => normalizeImage({ buffer, mimetype, originalname: "fake.png" }), error => error.statusCode === 400);
});

it("decodes and rewrites valid images with a generated WebP filename", async () => {
    const buffer = await sharp({ create: { width: 3, height: 2, channels: 3, background: "white" } }).png().toBuffer();
    const result = await normalizeImage({ buffer, mimetype: "image/png", originalname: "../../unsafe.png" });
    assert.equal(result.mimetype, "image/webp");
    assert.match(result.originalname, /^[a-f\d-]+\.webp$/);
    assert.equal((await sharp(result.buffer).metadata()).format, "webp");
});

it("sanitizes nested and legacy HTML while preserving useful formatting", () => {
    const result = safeContentTree({ sections: [{ html: '<p>Hello <strong>world</strong><script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">link</a><iframe src="x"></iframe></p>' }] });
    assert.match(result.sections[0].html, /<strong>world<\/strong>/);
    assert.doesNotMatch(result.sections[0].html, /script|onerror|iframe|javascript:/i);
});
