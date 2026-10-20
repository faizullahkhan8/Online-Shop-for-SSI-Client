import { it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { create, act } from "react-test-renderer";
import { useAddressLookup } from "../src/hooks/useAddressLookup.js";
import { validPosition, samePosition, savedRecipient, geocode } from "../src/utils/location.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function Harness(props) { useAddressLookup(props); return null; }

it("preserves zero coordinates and clears fields when switching saved customers", () => {
    assert.deepEqual(validPosition({ lat: "0", lng: "0" }), { lat: 0, lng: 0 });
    for (const value of [{ lat: "", lng: 0 }, { lat: 91, lng: 0 }, { lat: false, lng: 0 }, { lat: 0 }]) assert.equal(validPosition(value), null);
    assert.equal(samePosition({ lat: 0, lng: 0 }, { lat: "0", lng: "0" }), true);
    const user = savedRecipient({ name: "Second", addresses: [] });
    assert.equal(user.street, ""); assert.equal(user.phone, ""); assert.equal(user.lat, undefined);
});

it("never geocodes over saved DB address and coordinates", async () => {
    const original = globalThis.fetch; let calls = 0, root;
    globalThis.fetch = async () => { calls++; throw new Error("must not fetch"); };
    try {
        await act(async () => { root = create(React.createElement(Harness, { position: { lat: 0, lng: 0 }, savedPosition: { lat: 0, lng: 0 }, text: "My exact apartment", savedText: "My exact apartment", onPosition: () => assert.fail(), onAddress: () => assert.fail() })); });
        await act(async () => { await pause(1600); });
        assert.equal(calls, 0);
    } finally { await act(async () => root?.unmount()); globalThis.fetch = original; }
});

it("ignores an old reverse result after the pin changes, even if transport ignores abort", async () => {
    const original = globalThis.fetch, requests = [], addresses = []; let root;
    globalThis.fetch = () => new Promise(resolve => requests.push(resolve));
    const props = { text: "", onPosition: () => {}, onAddress: data => addresses.push(data.display_name) };
    try {
        await act(async () => { root = create(React.createElement(Harness, { ...props, position: { lat: 1, lng: 1 } })); });
        await act(async () => { await pause(1100); });
        await act(async () => { root.update(React.createElement(Harness, { ...props, position: { lat: 2, lng: 2 } })); });
        await act(async () => { await pause(1100); });
        await act(async () => { requests[1]({ ok: true, json: async () => ({ display_name: "New pin" }) }); });
        await act(async () => { requests[0]({ ok: true, json: async () => ({ display_name: "Old pin" }) }); });
        assert.deepEqual(addresses, ["New pin"]);
    } finally { await act(async () => root?.unmount()); globalThis.fetch = original; }
});

it("keeps manual edits made while reverse lookup is in flight", async () => {
    const original = globalThis.fetch; let resolve, root; const addresses = [];
    globalThis.fetch = () => new Promise(done => { resolve = done; });
    const props = { position: { lat: 3, lng: 3 }, onPosition: () => {}, onAddress: data => addresses.push(data) };
    try {
        await act(async () => { root = create(React.createElement(Harness, { ...props, text: "" })); });
        await act(async () => { await pause(1100); });
        await act(async () => { root.update(React.createElement(Harness, { ...props, text: "My manually entered address" })); });
        await act(async () => { resolve({ ok: true, json: async () => ({ display_name: "Provider address" }) }); });
        assert.deepEqual(addresses, []);
    } finally { await act(async () => root?.unmount()); globalThis.fetch = original; }
});

it("treats rate limits, empty results and invalid coordinates as lookup failures", async () => {
    await assert.rejects(() => geocode("search", "address", undefined, async () => ({ ok: false })), /unavailable/);
    assert.equal(await geocode("search", "address", undefined, async () => ({ ok: true, json: async () => [] })), null);
    assert.equal(await geocode("search", "address", undefined, async () => ({ ok: true, json: async () => [{ lat: "999", lon: "0" }] })), null);
});

it("forward lookup updates the pin without reverse lookup overwriting typed apartment details", async () => {
    const original = globalThis.fetch; let calls = 0, root, selected;
    globalThis.fetch = async () => { calls++; return { ok: true, json: async () => [{ lat: "0", lon: "0" }] }; };
    function TypedAddress() {
        const [position, setPosition] = React.useState(null);
        useAddressLookup({ position, text: "Apartment 7, exact street", onPosition: pin => { selected = pin; setPosition(pin); }, onAddress: () => assert.fail("Typed address must be retained") });
        return null;
    }
    try {
        await act(async () => { root = create(React.createElement(TypedAddress)); });
        await act(async () => { await pause(1600); });
        await act(async () => { await pause(1100); });
        assert.deepEqual(selected, { lat: 0, lng: 0 }); assert.equal(calls, 1);
    } finally { await act(async () => root?.unmount()); globalThis.fetch = original; }
});
