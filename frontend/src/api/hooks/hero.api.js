import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../apiClient.js";
import { toast } from "react-toastify";

const HERO_ROUTES = {
    BASE: "/hero",
};

export const useGetHeroSlides = () => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["hero-slides"],
        queryFn: async () => {
            const response = await apiClient.get(HERO_ROUTES.BASE);
            if (response.data?.success) {
                return response.data.slides;
            }
            return [];
        }
    });

    const getSlides = async () => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["hero-slides"],
                queryFn: async () => {
                    const response = await apiClient.get(HERO_ROUTES.BASE);
                    if (response.data?.success) {
                        return response.data.slides;
                    }
                    return [];
                }
            });
        } catch (error) {
            console.error("Error fetching hero slides:", error);
            return [];
        }
    };

    return { getSlides, slides: data || [], loading, error };
};

export const useAddHeroSlide = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (formData) => {
            const response = await apiClient.post(HERO_ROUTES.BASE, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data;
        },
        onSuccess: (data) => {
            toast.success(data?.message || "Slide added successfully");
            queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to add slide");
        }
    });

    const addSlide = async (formData) => {
        try {
            return await mutation.mutateAsync(formData);
        } catch {
            // error handled in onError
        }
    };

    return { addSlide, loading: mutation.isPending };
};

export const useUpdateHeroSlide = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ id, formData }) => {
            const response = await apiClient.put(`${HERO_ROUTES.BASE}/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data;
        },
        onSuccess: (data) => {
            toast.success(data?.message || "Slide updated successfully");
            queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update slide");
        }
    });

    const updateSlide = async (id, formData) => {
        try {
            return await mutation.mutateAsync({ id, formData });
        } catch {
            // error handled in onError
        }
    };

    return { updateSlide, loading: mutation.isPending };
};

export const useDeleteHeroSlide = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (id) => {
            const response = await apiClient.delete(`${HERO_ROUTES.BASE}/${id}`);
            return response.data;
        },
        onSuccess: (data) => {
            toast.success(data?.message || "Slide deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to delete slide");
        }
    });

    const deleteSlide = async (id) => {
        try {
            return await mutation.mutateAsync(id);
        } catch {
            // error handled in onError
        }
    };

    return { deleteSlide, loading: mutation.isPending };
};
