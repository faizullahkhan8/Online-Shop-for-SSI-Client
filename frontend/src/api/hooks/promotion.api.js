import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../apiClient";
import { PROMOTION_ROUTES } from "../routes";
import { toast } from "react-toastify";

export const useAddPromotion = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (promotionData) => {
            const response = await apiClient.post(PROMOTION_ROUTES.CREATE, promotionData);
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Failed to create promotion");
            }
            return response.data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Promotion created successfully");
            queryClient.invalidateQueries({ queryKey: ["promotions"] });
            queryClient.invalidateQueries({ queryKey: ["active-deals"] });
        },
        onError: (error) => {
            const msg = error.response?.data?.message || error.message || "Something went wrong";
            toast.error(msg);
        }
    });

    return {
        addPromotion: mutation.mutateAsync,
        loading: mutation.isPending,
        error: mutation.error?.message
    };
};

export const useGetActiveDeals = () => {
    const { data, isLoading: loading, error, refetch } = useQuery({
        queryKey: ["active-deals"],
        queryFn: async () => {
            const response = await apiClient.get(PROMOTION_ROUTES.GET_ACTIVE);
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Failed to fetch active deals");
            }
            return response.data;
        }
    });

    return {
        getActiveDeals: refetch,
        data,
        loading,
        error: error?.message
    };
};

export const useGetAllPromotions = () => {
    const { data, isLoading: loading, error, refetch } = useQuery({
        queryKey: ["promotions"],
        queryFn: async () => {
            const response = await apiClient.get(PROMOTION_ROUTES.GET_ALL);
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Failed to fetch promotions");
            }
            return response.data;
        }
    });

    return {
        getAllPromotions: refetch,
        data,
        loading,
        error: error?.message
    };
};

export const useGetPromotionById = (id) => {
    const { data, isLoading: loading, error, refetch } = useQuery({
        queryKey: ["promotions", id],
        queryFn: async () => {
            if (!id) return null;
            const response = await apiClient.get(`${PROMOTION_ROUTES.GET_ALL}/${id}`);
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Failed to fetch promotion");
            }
            return response.data;
        },
        enabled: !!id
    });

    return {
        getPromotionById: refetch,
        data,
        loading,
        error: error?.message
    };
};

export const useUpdatePromotion = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await apiClient.put(`${PROMOTION_ROUTES.UPDATE}/${id}`, data);
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Failed to update promotion");
            }
            return response.data;
        },
        onSuccess: (data, variables) => {
            toast.success(data.message || "Promotion updated successfully");
            queryClient.invalidateQueries({ queryKey: ["promotions"] });
            queryClient.invalidateQueries({ queryKey: ["active-deals"] });
        },
        onError: (error) => {
            const msg = error.response?.data?.message || error.message || "Something went wrong";
            toast.error(msg);
        }
    });

    const updatePromotion = (id, data) => mutation.mutateAsync({ id, data });

    return {
        updatePromotion,
        loading: mutation.isPending,
        error: mutation.error?.message
    };
};

export const useDeletePromotion = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (id) => {
            const response = await apiClient.delete(`${PROMOTION_ROUTES.DELETE}/${id}`);
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Failed to delete promotion");
            }
            return response.data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Promotion deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["promotions"] });
            queryClient.invalidateQueries({ queryKey: ["active-deals"] });
        },
        onError: (error) => {
            const msg = error.response?.data?.message || error.message || "Something went wrong";
            toast.error(msg);
        }
    });

    return {
        deletePromotion: mutation.mutateAsync,
        loading: mutation.isPending,
        error: mutation.error?.message
    };
};
