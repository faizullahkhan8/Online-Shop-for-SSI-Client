import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    items: [],
    totalAmount: 0,
    selectedTotalAmount: 0,
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const newItem = action.payload;
            if (!newItem?._id) return;
            const qty = newItem.quantity === undefined ? 1 : Number(newItem.quantity);
            if (!Number.isSafeInteger(qty) || qty < 1) return;
            if (newItem.stock !== undefined && (!Number.isSafeInteger(Number(newItem.stock)) || Number(newItem.stock) < 1)) return;
            const priceToUse =
                newItem.effectivePrice !== undefined
                    ? newItem.effectivePrice
                    : newItem.price;
            if (!Number.isFinite(Number(priceToUse)) || Number(priceToUse) < 0) return;
            const cartKey = newItem.variantId ? `${newItem._id}:${newItem.variantId}` : newItem._id;
            const existingItem = state.items.find(
                (item) => (item.cartKey || item._id) === cartKey,
            );
            if (!existingItem) {
                const finalQty = newItem.stock !== undefined && qty > newItem.stock ? newItem.stock : qty;
                state.items.push({
                    _id: newItem._id,
                    cartKey,
                    variantId: newItem.variantId,
                    variantName: newItem.variantName,
                    selectedVariant: newItem.selectedVariant,
                    name: newItem.name,
                    price: priceToUse,
                    originalPrice: newItem.price,
                    stock: newItem.stock,
                    image: newItem.image,
                    quantity: finalQty,
                    totalPrice: priceToUse * finalQty,
                    selected: true, // New items are selected by default
                });
            } else {
                if (newItem.stock !== undefined) existingItem.stock = Number(newItem.stock);
                existingItem.price = Number(priceToUse);
                const potentialQty = existingItem.quantity + qty;
                existingItem.quantity = existingItem.stock !== undefined && potentialQty > existingItem.stock
                    ? existingItem.stock
                    : potentialQty;
                existingItem.totalPrice =
                    existingItem.price * existingItem.quantity;
            }
            state.totalAmount = state.items.reduce(
                (total, item) => total + item.totalPrice,
                0,
            );
            state.selectedTotalAmount = state.items.reduce(
                (total, item) => total + (item.selected ? item.totalPrice : 0),
                0,
            );
        },
        removeFromCart: (state, action) => {
            const { _id, cartKey } = action.payload;
            const key = cartKey || _id;
            const existingItem = state.items.find((item) => (item.cartKey || item._id) === key);
            if (existingItem) {
                state.items = state.items.filter((item) => (item.cartKey || item._id) !== key);
                state.totalAmount = state.items.reduce(
                    (total, item) => total + item.totalPrice,
                    0,
                );
                state.selectedTotalAmount = state.items.reduce(
                    (total, item) =>
                        total + (item.selected ? item.totalPrice : 0),
                    0,
                );
            }
        },
        updateQuantity: (state, action) => {
            const { _id, cartKey } = action.payload;
            const quantity = Number(action.payload.quantity);
            if (!Number.isSafeInteger(quantity) || quantity < 1) return;
            const key = cartKey || _id;
            const existingItem = state.items.find((item) => (item.cartKey || item._id) === key);
            if (existingItem && quantity > 0) {
                const finalQty = existingItem.stock !== undefined && quantity > existingItem.stock
                    ? existingItem.stock
                    : quantity;
                existingItem.quantity = finalQty;
                existingItem.totalPrice = existingItem.price * finalQty;
                state.totalAmount = state.items.reduce(
                    (total, item) => total + item.totalPrice,
                    0,
                );
                state.selectedTotalAmount = state.items.reduce(
                    (total, item) =>
                        total + (item.selected ? item.totalPrice : 0),
                    0,
                );
            }
        },
        clearCart: (state) => {
            state.items = [];
            state.totalAmount = 0;
            state.selectedTotalAmount = 0;
        },
        toggleItemSelection: (state, action) => {
            const { _id, cartKey } = action.payload;
            const key = cartKey || _id;
            const item = state.items.find((item) => (item.cartKey || item._id) === key);
            if (item) {
                item.selected = !item.selected;
                state.selectedTotalAmount = state.items.reduce(
                    (total, item) =>
                        total + (item.selected ? item.totalPrice : 0),
                    0,
                );
            }
        },
        toggleAllSelection: (state, action) => {
            const { selected } = action.payload;
            state.items.forEach((item) => {
                item.selected = selected;
            });
            state.selectedTotalAmount = selected ? state.totalAmount : 0;
        },
        consumeCheckoutItems: (state, action) => {
            for (const purchased of action.payload.items) {
                const item = state.items.find(entry => entry._id === String(purchased.product?._id || purchased.product) && String(entry.variantId || "") === String(purchased.variantId || ""));
                if (!item || !Number.isSafeInteger(purchased.quantity) || purchased.quantity < 1) continue;
                item.quantity = Math.max(0, item.quantity - purchased.quantity);
                item.totalPrice = item.price * item.quantity;
            }
            state.items = state.items.filter(item => item.quantity > 0);
            state.totalAmount = state.items.reduce((sum, item) => sum + item.totalPrice, 0);
            state.selectedTotalAmount = state.items.reduce((sum, item) => sum + (item.selected ? item.totalPrice : 0), 0);
        },
        removeSelectedItems: (state, action) => {
            const { productIds } = action.payload;
            state.items = state.items.filter(
                (item) => !productIds.includes(item.cartKey || item._id),
            );
            state.totalAmount = state.items.reduce(
                (total, item) => total + item.totalPrice,
                0,
            );
            state.selectedTotalAmount = state.items.reduce(
                (total, item) => total + (item.selected ? item.totalPrice : 0),
                0,
            );
        },
    },
});

export const {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleItemSelection,
    toggleAllSelection,
    removeSelectedItems,
    consumeCheckoutItems,
} = cartSlice.actions;
export default cartSlice.reducer;
