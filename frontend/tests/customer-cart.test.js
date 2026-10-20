import { it } from "node:test";
import assert from "node:assert/strict";
import reducer, { addToCart, updateQuantity, toggleItemSelection, consumeCheckoutItems } from "../src/store/slices/cartSlice.js";

const product = { _id: "item-1", name: "Test", price: 10, stock: 5 };
it("does not put out-of-stock or invalid quantities/prices into the cart", () => {
    for (const patch of [{ stock: 0 }, { stock: -1 }, { quantity: 0 }, { quantity: 1.5 }, { quantity: Infinity }, { price: -1 }, { price: NaN }]) {
        const state = reducer(undefined, addToCart({ ...product, ...patch }));
        assert.deepEqual(state.items, []); assert.equal(state.totalAmount, 0);
    }
});
it("caps quantities to fresh stock and refreshes the displayed price", () => {
    let state = reducer(undefined, addToCart({ ...product, quantity: 4 }));
    state = reducer(state, addToCart({ ...product, stock: 2, effectivePrice: 8 }));
    assert.equal(state.items[0].quantity, 2); assert.equal(state.totalAmount, 16);
    state = reducer(state, updateQuantity({ _id: product._id, quantity: "1" }));
    assert.equal(state.items[0].quantity, 1); assert.equal(state.totalAmount, 8);
    for (const quantity of [-1, 1.2, Infinity]) assert.deepEqual(reducer(state, updateQuantity({ _id: product._id, quantity })), state);
});
it("successful checkout consumes only purchased quantities and preserves other cart additions", () => {
    let state = reducer(undefined, addToCart({ ...product, quantity: 2 }));
    state = reducer(state, addToCart({ ...product, _id: "item-2", quantity: 1 }));
    state = reducer(state, toggleItemSelection({ _id: "item-2" }));
    // Customer adds another unit while checkout for the original two is in flight.
    state = reducer(state, addToCart(product));
    state = reducer(state, consumeCheckoutItems({ items: [{ product: product._id, quantity: 2 }] }));
    assert.equal(state.items[0].quantity, 1); assert.equal(state.items[1].quantity, 1);
    assert.equal(state.totalAmount, 20); assert.equal(state.selectedTotalAmount, 10);
});
