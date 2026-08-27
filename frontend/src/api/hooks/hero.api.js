import { useState, useCallback } from "react";
import apiClient from "../apiClient.js";
import { toast } from "react-toastify";

const HERO_ROUTES = {
    BASE: "/hero",
};

export const useGetHeroSlides = () => {
    const [loading, setLoading] = useState(false);
    const [slides, setSlides] = useState([]);

    const getSlides = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(HERO_ROUTES.BASE);
            if (response.data?.success) {
                setSlides(response.data.slides);
            }
        } catch (error) {
            console.error("Error fetching hero slides:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    return { getSlides, slides, loading };
};

export const useAddHeroSlide = () => {
    const [loading, setLoading] = useState(false);

    const addSlide = async (formData) => {
        setLoading(true);
        try {
            const response = await apiClient.post(HERO_ROUTES.BASE, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (response.data?.success) {
                toast.success(response.data.message || "Slide added successfully");
                return response.data;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add slide");
        } finally {
            setLoading(false);
        }
    };

    return { addSlide, loading };
};

export const useUpdateHeroSlide = () => {
    const [loading, setLoading] = useState(false);

    const updateSlide = async (id, formData) => {
        setLoading(true);
        try {
            const response = await apiClient.put(`${HERO_ROUTES.BASE}/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (response.data?.success) {
                toast.success(response.data.message || "Slide updated successfully");
                return response.data;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update slide");
        } finally {
            setLoading(false);
        }
    };

    return { updateSlide, loading };
};

export const useDeleteHeroSlide = () => {
    const [loading, setLoading] = useState(false);

    const deleteSlide = async (id) => {
        setLoading(true);
        try {
            const response = await apiClient.delete(`${HERO_ROUTES.BASE}/${id}`);
            if (response.data?.success) {
                toast.success(response.data.message || "Slide deleted successfully");
                return response.data;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete slide");
        } finally {
            setLoading(false);
        }
    };

    return { deleteSlide, loading };
};
