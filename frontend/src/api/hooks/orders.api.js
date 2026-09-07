import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ORDER_ROUTES } from "../routes";
import apiClient from "../apiClient.js";
import { toast } from "react-toastify";

export const useGetUnreadOrdersCount = () => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["unread-orders-count"],
        queryFn: async () => {
            const res = await apiClient.get("/orders/unread-count");
            return res.data;
        }
    });

    const getUnreadCount = async () => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["unread-orders-count"],
                queryFn: async () => {
                    const res = await apiClient.get("/orders/unread-count");
                    return res.data;
                }
            });
        } catch (error) {
            console.error("Error fetching unread orders count:", error);
        }
    };

    return { getUnreadCount, count: data?.count || 0, loading, error };
};

export const useMarkOrderViewed = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (id) => {
            const res = await apiClient.patch(`/orders/${id}/mark-viewed`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["unread-orders-count"] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: (error) => {
            console.error("Error marking order viewed:", error);
        }
    });

    const markOrderViewed = async (id) => {
        try {
            return await mutation.mutateAsync(id);
        } catch {
            return null;
        }
    };

    return { markOrderViewed, loading: mutation.isPending };
};

export const usePlaceOrder = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (orderData) => {
            const response = await apiClient.post(ORDER_ROUTES.PLACE, orderData);
            return response.data;
        },
        onSuccess: (data) => {
            if (data) {
                toast.success("Order placed successfully.");
                queryClient.invalidateQueries({ queryKey: ["orders"] });
                queryClient.invalidateQueries({ queryKey: ["my-orders"] });
                queryClient.invalidateQueries({ queryKey: ["unread-orders-count"] });
            }
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || "Something went wrong. try again!";
            toast.error(errorMessage);
            console.log("Error in place order: ", error.message);
        }
    });

    const placeOrder = async (orderData) => {
        try {
            return await mutation.mutateAsync(orderData);
        } catch {
            return undefined;
        }
    };

    return { placeOrder, loading: mutation.isPending };
};

export const useGetAllOrder = () => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["orders"],
        queryFn: async () => {
            const response = await apiClient.get(ORDER_ROUTES.GET_ALL);
            if (response.data?.orders && Array.isArray(response.data.orders)) {
                response.data.orders = response.data.orders.map((o) => ({
                    ...o,
                    id: o._id,
                    date: o.createdAt,
                    totalAmount: o.grandTotal ?? o.totalAmount,
                }));
            }
            return response.data;
        }
    });

    const getAllOrder = async () => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["orders"],
                queryFn: async () => {
                    const response = await apiClient.get(ORDER_ROUTES.GET_ALL);
                    if (response.data?.orders && Array.isArray(response.data.orders)) {
                        response.data.orders = response.data.orders.map((o) => ({
                            ...o,
                            id: o._id,
                            date: o.createdAt,
                            totalAmount: o.grandTotal ?? o.totalAmount,
                        }));
                    }
                    return response.data;
                }
            });
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Something went wrong. try again!";
            toast.error(errorMessage);
            console.log("Error in get all order: ", error.message);
            return undefined;
        }
    };

    return { getAllOrder, loading, data, error };
};

export const useGetUserOrders = () => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["my-orders"],
        queryFn: async () => {
            const response = await apiClient.get(ORDER_ROUTES.MY_ORDERS);
            if (response.data?.orders && Array.isArray(response.data.orders)) {
                response.data.orders = response.data.orders.map((o) => ({
                    ...o,
                    id: o._id,
                    date: o.createdAt,
                    totalAmount: o.grandTotal ?? o.totalAmount,
                }));
            }
            return response.data;
        }
    });

    const getUserOrders = async () => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["my-orders"],
                queryFn: async () => {
                    const response = await apiClient.get(ORDER_ROUTES.MY_ORDERS);
                    if (response.data?.orders && Array.isArray(response.data.orders)) {
                        response.data.orders = response.data.orders.map((o) => ({
                            ...o,
                            id: o._id,
                            date: o.createdAt,
                            totalAmount: o.grandTotal ?? o.totalAmount,
                        }));
                    }
                    return response.data;
                }
            });
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Something went wrong. try again!";
            toast.error(errorMessage);
            console.log("Error in get user orders: ", error.message);
            return undefined;
        }
    };

    return { getUserOrders, loading, data, error };
};

export const useGetOrderById = (defaultId = null) => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["orders", defaultId],
        queryFn: async () => {
            const response = await apiClient.get(`${ORDER_ROUTES.GET_BY_ID}/${defaultId}`);
            if (response.data?.order) {
                const o = response.data.order;
                response.data.order = {
                    ...o,
                    id: o._id,
                    date: o.createdAt,
                    totalAmount: o.grandTotal ?? o.totalAmount,
                };
            }
            return response.data;
        },
        enabled: defaultId !== null
    });

    const getOrderById = async (orderId) => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["orders", orderId],
                queryFn: async () => {
                    const response = await apiClient.get(`${ORDER_ROUTES.GET_BY_ID}/${orderId}`);
                    if (response.data?.order) {
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
            });
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Something went wrong. try again!";
            toast.error(errorMessage);
            console.log("Error in get order by id: ", error.message);
            return undefined;
        }
    };

    return { getOrderById, loading, data, error };
};

export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ orderId, status }) => {
            const response = await apiClient.patch(`${ORDER_ROUTES.UPDATE}/${orderId}`, { status });
            return response.data;
        },
        onSuccess: (data, variables) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: ["orders"] });
                queryClient.invalidateQueries({ queryKey: ["my-orders"] });
                queryClient.invalidateQueries({ queryKey: ["orders", variables.orderId] });
            }
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || "Something went wrong. try again!";
            toast.error(errorMessage);
            console.log("Error in update order status: ", error.message);
        }
    });

    const updateOrderStatus = async (variables) => {
        try {
            return await mutation.mutateAsync(variables);
        } catch {
            return undefined;
        }
    };

    return { updateOrderStatus, loading: mutation.isPending };
};

export const useUpdatePaymentStatus = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ orderId, ispaid }) => {
            const response = await apiClient.patch(`${ORDER_ROUTES.UPDATE_PAYMENT || "/orders/payment"}/${orderId}`, { ispaid });
            return response.data;
        },
        onSuccess: (data, variables) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: ["orders"] });
                queryClient.invalidateQueries({ queryKey: ["my-orders"] });
                queryClient.invalidateQueries({ queryKey: ["orders", variables.orderId] });
            }
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || "Something went wrong. try again!";
            toast.error(errorMessage);
            console.log("Error in update payment status: ", error.message);
        }
    });

    const updatePaymentStatus = async (variables) => {
        try {
            return await mutation.mutateAsync(variables);
        } catch {
            return undefined;
        }
    };

    return { updatePaymentStatus, loading: mutation.isPending };
};

export const useDeleteOrder = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (orderId) => {
            const response = await apiClient.delete(`${ORDER_ROUTES.DELETE}/${orderId}`);
            return response.data;
        },
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: ["orders"] });
                queryClient.invalidateQueries({ queryKey: ["my-orders"] });
            }
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || "Something went wrong. try again!";
            toast.error(errorMessage);
            console.log("Error in delete order: ", error.message);
        }
    });

    const deleteOrder = async (orderId) => {
        try {
            return await mutation.mutateAsync(orderId);
        } catch {
            return undefined;
        }
    };

    return { deleteOrder, loading: mutation.isPending };
};

export const useCancelOrderItem = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ orderId, itemId, reason }) => {
            const response = await apiClient.put(`${ORDER_ROUTES.CANCEL_ITEM || "/orders"}/${orderId}/items/${itemId}/cancel`, { reason });
            if (response.data?.order) {
                const o = response.data.order;
                response.data.order = {
                    ...o,
                    id: o._id,
                    date: o.createdAt,
                    totalAmount: o.grandTotal ?? o.totalAmount,
                };
            }
            return response.data;
        },
        onSuccess: (data, variables) => {
            if (data) {
                toast.success("Order item cancelled successfully.");
                queryClient.invalidateQueries({ queryKey: ["orders"] });
                queryClient.invalidateQueries({ queryKey: ["my-orders"] });
                queryClient.invalidateQueries({ queryKey: ["orders", variables.orderId] });
            }
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || "Something went wrong. Try again!";
            toast.error(errorMessage);
            console.log("Error in cancel order item:", error.message);
        }
    });

    const cancelOrderItem = async (variables) => {
        try {
            return await mutation.mutateAsync(variables);
        } catch {
            return undefined;
        }
    };

    return { cancelOrderItem, loading: mutation.isPending };
};

export const useCancelOrder = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ orderId, reason }) => {
            const response = await apiClient.put(`${ORDER_ROUTES.CANCEL || "/orders"}/${orderId}/cancel`, { reason });
            if (response.data?.order) {
                const o = response.data.order;
                response.data.order = {
                    ...o,
                    id: o._id,
                    date: o.createdAt,
                    totalAmount: o.grandTotal ?? o.totalAmount,
                };
            }
            return response.data;
        },
        onSuccess: (data, variables) => {
            if (data) {
                toast.success("Order cancelled successfully.");
                queryClient.invalidateQueries({ queryKey: ["orders"] });
                queryClient.invalidateQueries({ queryKey: ["my-orders"] });
                queryClient.invalidateQueries({ queryKey: ["orders", variables.orderId] });
            }
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || "Something went wrong. Try again!";
            toast.error(errorMessage);
            console.log("Error in cancel order:", error.message);
        }
    });

    const cancelOrder = async (variables) => {
        try {
            return await mutation.mutateAsync(variables);
        } catch {
            return undefined;
        }
    };

    return { cancelOrder, loading: mutation.isPending };
};
