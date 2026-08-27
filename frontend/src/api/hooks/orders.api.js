import { useState, useCallback } from "react";
import { ORDER_ROUTES } from "../routes";
import apiClient from "../apiClient.js";
import { toast } from "react-toastify";
export const useGetUnreadOrdersCount = () => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const getUnreadCount = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get("/orders/unread-count");
            if (res.data?.success) setCount(res.data.count);
        } catch (error) {
            console.error("Error fetching unread orders count:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    return { getUnreadCount, count, loading };
};

export const useMarkOrderViewed = () => {
    const [loading, setLoading] = useState(false);

    const markOrderViewed = async (id) => {
        setLoading(true);
        try {
            const res = await apiClient.patch(`/orders/${id}/mark-viewed`);
            return res.data;
        } catch (error) {
            console.error("Error marking order viewed:", error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { markOrderViewed, loading };
};

export const usePlaceOrder = () => {
    const [loading, setLoading] = useState();

    const placeOrder = async (orderData) => {
        try {
            setLoading(true);
            const response = await apiClient.post(
                ORDER_ROUTES.PLACE,
                orderData,
            );

            if (response.data) {
                toast.success("Order placed successfully.");
                return response.data;
            }
        } catch (error) {
            let errorMessage =
                error.response.data.message ||
                "Something went wronge. try again!";
            toast.error(errorMessage);
            console.log("Error in place order: ", error.message);
        } finally {
            setLoading(false);
        }
    };

    return { placeOrder, loading };
};

export const useGetAllOrder = () => {
    const [loading, setLoading] = useState();
    const getAllOrder = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(ORDER_ROUTES.GET_ALL);

            if (response.data) {
                // normalize orders: add id alias and date/totalAmount for UI
                if (Array.isArray(response.data.orders)) {
                    response.data.orders = response.data.orders.map((o) => ({
                        ...o,
                        id: o._id,
                        date: o.createdAt,
                        totalAmount: o.grandTotal ?? o.totalAmount,
                    }));
                }
                return response.data;
            }
        } catch (error) {
            let errorMessage =
                error.response.data.message ||
                "Something went wronge. try again!";
            toast.error(errorMessage);
            console.log("Error in place order: ", error.message);
        } finally {
            setLoading(false);
        }
    };

    return { getAllOrder, loading };
};

export const useGetUserOrders = () => {
    const [loading, setLoading] = useState();
    const getUserOrders = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(ORDER_ROUTES.MY_ORDERS);

            if (response.data) {
                if (Array.isArray(response.data.orders)) {
                    response.data.orders = response.data.orders.map((o) => ({
                        ...o,
                        id: o._id,
                        date: o.createdAt,
                        totalAmount: o.grandTotal ?? o.totalAmount,
                    }));
                }
                return response.data;
            }
        } catch (error) {
            let errorMessage =
                error.response?.data?.message ||
                "Something went wronge. try again!";
            toast.error(errorMessage);
            console.log("Error in get user orders: ", error.message);
        } finally {
            setLoading(false);
        }
    };

    return { getUserOrders, loading };
};

export const useGetOrderById = () => {
    const [loading, setLoading] = useState();
    const getOrderById = async (orderId) => {
        try {
            setLoading(true);
            const response = await apiClient.get(
                `${ORDER_ROUTES.GET_BY_ID}/${orderId}`,
            );

            if (response.data && response.data.order) {
                const o = response.data.order;
                response.data.order = {
                    ...o,
                    id: o._id,
                    date: o.createdAt,
                    totalAmount: o.grandTotal ?? o.totalAmount,
                };
                return response.data;
            }
        } catch (error) {
            let errorMessage =
                error.response?.data?.message ||
                "Something went wronge. try again!";
            toast.error(errorMessage);
            console.log("Error in get order by id: ", error.message);
        } finally {
            setLoading(false);
        }
    };

    return { getOrderById, loading };
};

export const useUpdateOrderStatus = () => {
    const [loading, setLoading] = useState();
    const updateOrderStatus = async ({ orderId, status }) => {
        try {
            setLoading(true);
            const response = await apiClient.patch(
                `${ORDER_ROUTES.UPDATE}/${orderId}`,
                { status },
            );

            if (response.data) return response.data;
        } catch (error) {
            let errorMessage =
                error.response?.data?.message ||
                "Something went wronge. try again!";
            toast.error(errorMessage);
            console.log("Error in update order status: ", error.message);
        } finally {
            setLoading(false);
        }
    };

    return { updateOrderStatus, loading };
};

export const useUpdatePaymentStatus = () => {
    const [loading, setLoading] = useState();
    const updatePaymentStatus = async ({ orderId, ispaid }) => {
        try {
            setLoading(true);
            const response = await apiClient.patch(
                `${ORDER_ROUTES.UPDATE_PAYMENT || "/orders/payment"}/${orderId}`,
                { ispaid },
            );

            if (response.data) return response.data;
        } catch (error) {
            let errorMessage =
                error.response?.data?.message ||
                "Something went wronge. try again!";
            toast.error(errorMessage);
            console.log("Error in update payment status: ", error.message);
        } finally {
            setLoading(false);
        }
    };

    return { updatePaymentStatus, loading };
};

export const useDeleteOrder = () => {
    const [loading, setLoading] = useState();
    const deleteOrder = async (orderId) => {
        try {
            setLoading(true);
            const response = await apiClient.delete(
                `${ORDER_ROUTES.DELETE}/${orderId}`,
            );

            if (response.data) return response.data;
        } catch (error) {
            let errorMessage =
                error.response?.data?.message ||
                "Something went wronge. try again!";
            toast.error(errorMessage);
            console.log("Error in delete order: ", error.message);
        } finally {
            setLoading(false);
        }
    };

    return { deleteOrder, loading };
};

export const useCancelOrderItem = () => {
    const [loading, setLoading] = useState(false);

    const cancelOrderItem = async ({ orderId, itemId, reason }) => {
        try {
            setLoading(true);

            const response = await apiClient.put(
                `${ORDER_ROUTES.CANCEL_ITEM || "/orders"}/${orderId}/items/${itemId}/cancel`,
                { reason },
            );

            if (response.data) {
                toast.success("Order item cancelled successfully.");

                // normalize order if backend returns updated order
                if (response.data.order) {
                    const o = response.data.order;
                    response.data.order = {
                        ...o,
                        id: o._id,
                        date: o.createdAt,
                        totalAmount: o.grandTotal ?? o.totalAmount,
                    };
                }

                return response.data;
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                "Something went wrong. Try again!";
            toast.error(errorMessage);
            console.log("Error in cancel order item:", error.message);
        } finally {
            setLoading(false);
        }
    };

    return { cancelOrderItem, loading };
};

export const useCancelOrder = () => {
    const [loading, setLoading] = useState(false);

    const cancelOrder = async ({ orderId, reason }) => {
        try {
            setLoading(true);

            const response = await apiClient.put(
                `${ORDER_ROUTES.CANCEL || "/orders"}/${orderId}/cancel`,
                { reason },
            );

            if (response.data) {
                toast.success("Order cancelled successfully.");

                // normalize updated order for UI consistency
                if (response.data.order) {
                    const o = response.data.order;
                    response.data.order = {
                        ...o,
                        id: o._id,
                        date: o.createdAt,
                        totalAmount: o.grandTotal ?? o.totalAmount,
                    };
                }

                return response.data;
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                "Something went wrong. Try again!";
            toast.error(errorMessage);
            console.log("Error in cancel order:", error.message);
        } finally {
            setLoading(false);
        }
    };

    return { cancelOrder, loading };
};
