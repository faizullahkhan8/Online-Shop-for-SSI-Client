import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../apiClient.js";

export const useGetUnreadPrescriptionsCount = () => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["unread-prescriptions-count"],
        queryFn: async () => {
            const res = await apiClient.get("/prescriptions/unread-count");
            return res.data;
        }
    });

    const getUnreadCount = async () => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["unread-prescriptions-count"],
                queryFn: async () => {
                    const res = await apiClient.get("/prescriptions/unread-count");
                    return res.data;
                }
            });
        } catch (error) {
            console.error("Error fetching unread prescriptions count:", error);
            return undefined;
        }
    };

    return { getUnreadCount, count: data?.count || 0, loading };
};

export const useMarkPrescriptionViewed = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (id) => {
            const res = await apiClient.put(`/prescriptions/${id}/mark-viewed`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["unread-prescriptions-count"] });
            queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
        },
        onError: (error) => {
            console.error("Error marking prescription viewed:", error);
        }
    });

    const markAsViewed = async (id) => {
        try {
            return await mutation.mutateAsync(id);
        } catch {
            return null;
        }
    };

    return { markAsViewed, loading: mutation.isPending };
};

export const useUploadPrescription = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ formData, onUploadProgress }) => {
            const response = await apiClient.post("/prescriptions", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
            queryClient.invalidateQueries({ queryKey: ["unread-prescriptions-count"] });
        },
        onError: (error) => {
            console.error("Error uploading prescription:", error);
        }
    });

    const uploadPrescription = async (formData, onUploadProgress) => {
        try {
            return await mutation.mutateAsync({ formData, onUploadProgress });
        } catch (error) {
            throw error;
        }
    };

    return { uploadPrescription, loading: mutation.isPending };
};

export const useGetAllPrescriptions = () => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["prescriptions", "all"],
        queryFn: async () => {
            const response = await apiClient.get("/prescriptions");
            return response.data;
        }
    });

    const getAllPrescriptions = async () => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["prescriptions", "all"],
                queryFn: async () => {
                    const response = await apiClient.get("/prescriptions");
                    return response.data;
                }
            });
        } catch (error) {
            console.error("Error fetching all prescriptions:", error);
            throw error;
        }
    };

    return { getAllPrescriptions, loading, data, error };
};

export const useGetUserPrescriptions = () => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["prescriptions", "my"],
        queryFn: async () => {
            const response = await apiClient.get("/prescriptions/my");
            return response.data;
        }
    });

    const getUserPrescriptions = async () => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["prescriptions", "my"],
                queryFn: async () => {
                    const response = await apiClient.get("/prescriptions/my");
                    return response.data;
                }
            });
        } catch (error) {
            console.error("Error fetching user prescriptions:", error);
            throw error;
        }
    };

    return { getUserPrescriptions, loading, data, error };
};

export const useUpdatePrescriptionStatus = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ id, status }) => {
            const response = await apiClient.put(`/prescriptions/${id}/status`, { status });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
        },
        onError: (error) => {
            console.error("Error updating prescription status:", error);
        }
    });

    const updatePrescriptionStatus = async (id, status) => {
        try {
            return await mutation.mutateAsync({ id, status });
        } catch (error) {
            throw error;
        }
    };

    return { updatePrescriptionStatus, loading: mutation.isPending };
};

export const useDeletePrescription = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (id) => {
            const response = await apiClient.delete(`/prescriptions/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
        },
        onError: (error) => {
            console.error("Error deleting prescription:", error);
        }
    });

    const deletePrescription = async (id) => {
        try {
            return await mutation.mutateAsync(id);
        } catch (error) {
            throw error;
        }
    };

    return { deletePrescription, loading: mutation.isPending };
};
