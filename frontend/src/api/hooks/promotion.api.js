import { useState, useCallback } from "react";
import apiClient from "../apiClient";
import { PROMOTION_ROUTES } from "../routes";
import { toast } from "react-toastify";

export const useAddPromotion = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const addPromotion = async (promotionData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post(
                PROMOTION_ROUTES.CREATE,
                promotionData,
            );
            if (response.data?.success) {
                toast.success(
                    response.data.message || "Promotion created successfully",
                );
                return response.data;
            } else {
                toast.error(response.data?.message || "Failed to create promotion");
                return null;
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Something went wrong";
            setError(msg);
            toast.error(msg);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { addPromotion, loading, error };
};

export const useGetActiveDeals = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getActiveDeals = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(PROMOTION_ROUTES.GET_ACTIVE);
            if (response.data?.success) {
                return response.data;
            } else {
                setError(response.data?.message || "Failed to fetch active deals");
                return null;
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Something went wrong";
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { getActiveDeals, loading, error };
};

export const useGetAllPromotions = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getAllPromotions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(PROMOTION_ROUTES.GET_ALL);
            if (response.data?.success) {
                return response.data;
            } else {
                setError(response.data?.message || "Failed to fetch promotions");
                return null;
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Something went wrong";
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { getAllPromotions, loading, error };
};

export const useGetPromotionById = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getPromotionById = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(
                `${PROMOTION_ROUTES.GET_ALL}/${id}`,
            );
            if (response.data?.success) {
                return response.data;
            } else {
                setError(response.data?.message || "Failed to fetch promotion");
                return null;
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Something went wrong";
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { getPromotionById, loading, error };
};

export const useUpdatePromotion = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const updatePromotion = async (id, data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.put(
                `${PROMOTION_ROUTES.UPDATE}/${id}`,
                data,
            );
            if (response.data?.success) {
                toast.success(
                    response.data.message || "Promotion updated successfully",
                );
                return response.data;
            } else {
                toast.error(
                    response.data?.message || "Failed to update promotion",
                );
                return null;
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Something went wrong";
            setError(msg);
            toast.error(msg);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { updatePromotion, loading, error };
};

export const useDeletePromotion = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const deletePromotion = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.delete(
                `${PROMOTION_ROUTES.DELETE}/${id}`,
            );
            if (response.data?.success) {
                toast.success(
                    response.data.message || "Promotion deleted successfully",
                );
                return response.data;
            } else {
                toast.error(
                    response.data?.message || "Failed to delete promotion",
                );
                return null;
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Something went wrong";
            setError(msg);
            toast.error(msg);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { deletePromotion, loading, error };
};
