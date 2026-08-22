import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    orders: [],
};

const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        addOrder: (state, action) => {
            state.orders.unshift(action.payload); // Add new order to top
        },
        setOrders: (state, action) => {
            state.orders = action.payload;
        },
    },
});


export default orderSlice.reducer;
