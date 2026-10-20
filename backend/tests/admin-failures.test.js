import { it } from "node:test";
import assert from "node:assert/strict";
import { uploadImageBatch } from "../services/imageUploads.js";
import apiClient from "../../frontend/src/api/apiClient.js";

it("cleans up successful images when another upload fails and returns a safe error", async () => {
    const deleted = [];
    const files = ["first", "second"].map(originalname => ({ originalname, buffer: Buffer.from("synthetic") }));
    const client = {
        upload: async ({ fileName }) => {
            if (fileName === "second") throw new Error("private provider response");
            return { fileId: "uploaded-first" };
        },
        delete: async id => deleted.push(id),
    };
    await assert.rejects(() => uploadImageBatch(files, client), error => error.statusCode === 503 && !error.message.includes("private"));
    assert.deepEqual(deleted, ["uploaded-first"]);
});

it("does not automatically retry mutations after a network disconnect", async () => {
    let calls = 0;
    const adapter = apiClient.defaults.adapter;
    try {
        apiClient.defaults.adapter = async config => { calls++; throw Object.assign(new Error("Network Error"), { config, code: "ERR_NETWORK" }); };
        await assert.rejects(() => apiClient.post("/orders/place-order", {}), { code: "ERR_NETWORK" });
        assert.equal(calls, 1);
        assert.equal(apiClient.defaults.timeout, 60000);
    } finally { apiClient.defaults.adapter = adapter; }
});

it("fails a rejected token refresh without recursive refresh or hanging the queue", async () => {
    let calls = 0;
    const adapter = apiClient.defaults.adapter;
    try {
        apiClient.defaults.adapter = async config => {
            calls++;
            throw Object.assign(new Error("Expired"), { config, response: { status: 401, data: { message: "Access token expired" } } });
        };
        const responses = await Promise.allSettled([apiClient.get("/orders/get-all"), apiClient.get("/settings/admin")]);
        assert.ok(responses.every(result => result.status === "rejected"));
        assert.equal(calls, 3);
    } finally { apiClient.defaults.adapter = adapter; }
});
