import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    items: [], // Array of product objects
};

const wishlistSlice = createSlice({
    name: "wishlist",
    initialState,
    reducers: {
        setWishlist: (state, action) => {
            state.items = action.payload || [];
        },
        toggleWishlist: (state, action) => {
            const product = action.payload;
            console.log(product, state.items);
            const existingIndex = state.items.findIndex((item) => {
                const a = item._id || item.id;
                const b = product._id || product.id;
                return a && b && a.toString() === b.toString();
            });
            if (existingIndex >= 0) {
                state.items.splice(existingIndex, 1);
            } else {
                state.items.push(product);
            }
        },
        clearWishlist: (state) => {
            state.items = [];
        },
    },
});

export const { toggleWishlist,  setWishlist } =
    wishlistSlice.actions;
export default wishlistSlice.reducer;
