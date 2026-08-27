import { useCallback, useState } from "react";
import apiClient from "../apiClient";
import { REVIEW_ROUTES } from "../routes";
import { toast } from "react-toastify";

export const useAddReview = () => {
    const [loading, setLoading] = useState(false);

    const addReview = async (reviewData) => {
        setLoading(true);
        try {
            const response = await apiClient.post(REVIEW_ROUTES.ADD, reviewData);
            if (response.data) {
                toast.success("Review submitted successfully");
                return response.data;
            }
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Add Review", error);
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    return { addReview, loading };
};

export const useGetProductReviews = () => {
    const [loading, setLoading] = useState(false);
    const [reviews, setReviews] = useState([]);

    const getReviews = useCallback(async (productId) => {
        setLoading(true);
        try {
            const response = await apiClient.get(
                `${REVIEW_ROUTES.GET_BY_PRODUCT}/${productId}`,
            );
            if (response.data && response.data.success) {
                setReviews(response.data.reviews);
                return response.data;
            }
        } catch (error) {
            console.log("Error in Get Reviews", error);
            return { success: false };
        } finally {
            setLoading(false);
        }
    }, []);

    return { getReviews, reviews, loading };
};
