import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../apiClient";
import { toast } from "react-toastify";

const STAFF_ROUTES = {
    GET_ALL: "/staff",
    CREATE: "/staff",
    UPDATE: (id) => `/staff/${id}`,
    DELETE: (id) => `/staff/${id}`,
};

export const useGetStaff = () => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, refetch } = useQuery({
        queryKey: ["staff"],
        queryFn: async () => {
            const response = await apiClient.get(STAFF_ROUTES.GET_ALL);
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        },
        onError: (error) => {
            console.error("Error fetching staff:", error);
            toast.error(error.response?.data?.message || "Failed to fetch staff.");
        }
    });

    const getStaff = async () => {
        try {
            const response = await queryClient.fetchQuery({
                queryKey: ["staff"],
                queryFn: async () => {
                    const res = await apiClient.get(STAFF_ROUTES.GET_ALL);
                    if (res.data && res.data.success) {
                        return res.data.data;
                    }
                    return [];
                }
            });
            return response;
        } catch (error) {
            console.error("Error fetching staff:", error);
            toast.error(error.response?.data?.message || "Failed to fetch staff.");
            return [];
        }
    };

    return { getStaff, data: data || [], loading };
};

export const useCreateStaff = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (staffData) => {
            const config = staffData instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
            const response = await apiClient.post(STAFF_ROUTES.CREATE, staffData, config);
            return response.data.data;
        },
        onSuccess: () => {
            toast.success("Staff node created successfully");
            queryClient.invalidateQueries({ queryKey: ["staff"] });
        },
        onError: (error) => {
            console.error("Error creating staff:", error);
            toast.error(error.response?.data?.message || "Failed to create staff node.");
        }
    });

    const createStaff = async (staffData) => {
        try {
            return await mutation.mutateAsync(staffData);
        } catch {
            return null;
        }
    };

    return { createStaff, loading: mutation.isPending };
};

export const useUpdateStaff = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ id, staffData }) => {
            const config = staffData instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
            const response = await apiClient.put(STAFF_ROUTES.UPDATE(id), staffData, config);
            return response.data.data;
        },
        onSuccess: () => {
            toast.success("Staff node updated successfully");
            queryClient.invalidateQueries({ queryKey: ["staff"] });
        },
        onError: (error) => {
            console.error("Error updating staff:", error);
            toast.error(error.response?.data?.message || "Failed to update staff node.");
        }
    });

    const updateStaff = async (id, staffData) => {
        try {
            return await mutation.mutateAsync({ id, staffData });
        } catch {
            return null;
        }
    };

    return { updateStaff, loading: mutation.isPending };
};

export const useDeleteStaff = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (id) => {
            const response = await apiClient.delete(STAFF_ROUTES.DELETE(id));
            return response.data.success;
        },
        onSuccess: () => {
            toast.success("Staff node deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["staff"] });
        },
        onError: (error) => {
            console.error("Error deleting staff:", error);
            toast.error(error.response?.data?.message || "Failed to delete staff node.");
        }
    });

    const deleteStaff = async (id) => {
        try {
            await mutation.mutateAsync(id);
            return true;
        } catch {
            return false;
        }
    };

    return { deleteStaff, loading: mutation.isPending };
};
