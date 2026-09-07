import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../apiClient";
import { REVIEW_ROUTES } from "../routes";
import { toast } from "react-toastify";

export const useAddReview = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (reviewData) => {
            const response = await apiClient.post(REVIEW_ROUTES.ADD, reviewData);
            return response.data;
        },
        onSuccess: (data, variables) => {
            toast.success("Review submitted successfully");
            if (variables?.productId) {
                queryClient.invalidateQueries({ queryKey: ["reviews", variables.productId] });
            }
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(errorMessage);
            console.log("Error in Add Review", error);
        }
    });

    const addReview = async (reviewData) => {
        try {
            return await mutation.mutateAsync(reviewData);
        } catch {
            return { success: false };
        }
    };

    return { addReview, loading: mutation.isPending };
};

export const useGetProductReviews = (productId) => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, refetch } = useQuery({
        queryKey: ["reviews", productId],
        queryFn: async () => {
            if (!productId) return [];
            const response = await apiClient.get(`${REVIEW_ROUTES.GET_BY_PRODUCT}/${productId}`);
            if (response.data && response.data.success) {
                return response.data.reviews;
            }
            return [];
        },
        enabled: !!productId
    });

    const getReviews = async (id) => {
        try {
            const response = await queryClient.fetchQuery({
                queryKey: ["reviews", id],
                queryFn: async () => {
                    const res = await apiClient.get(`${REVIEW_ROUTES.GET_BY_PRODUCT}/${id}`);
                    if (res.data && res.data.success) {
                        return res.data;
                    }
                    return { success: false, reviews: [] };
                }
            });
            return response;
        } catch (error) {
            console.log("Error in Get Reviews", error);
            return { success: false, reviews: [] };
        }
    };

    return { getReviews, reviews: data || [], loading };
};
