import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../apiClient.js";

export const useGetMenus = () => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["menus"],
        queryFn: async () => {
            const response = await apiClient.get("/menus");
            return response.data;
        }
    });

    const getMenus = async () => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["menus"],
                queryFn: async () => {
                    const response = await apiClient.get("/menus");
                    return response.data;
                }
            });
        } catch (error) {
            console.error("Error fetching menus:", error);
            throw error;
        }
    };

    return { getMenus, loading, data, error };
};

export const useCreateMenu = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (menuData) => {
            const response = await apiClient.post("/menus", menuData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menus"] });
        },
        onError: (error) => {
            console.error("Error creating menu:", error);
        }
    });

    const createMenu = async (menuData) => {
        try {
            return await mutation.mutateAsync(menuData);
        } catch (error) {
            throw error;
        }
    };

    return { createMenu, loading: mutation.isPending };
};

export const useUpdateMenu = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ id, menuData }) => {
            const response = await apiClient.put(`/menus/${id}`, menuData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menus"] });
        },
        onError: (error) => {
            console.error("Error updating menu:", error);
        }
    });

    const updateMenu = async (id, menuData) => {
        try {
            return await mutation.mutateAsync({ id, menuData });
        } catch (error) {
            throw error;
        }
    };

    return { updateMenu, loading: mutation.isPending };
};

export const useDeleteMenu = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (id) => {
            const response = await apiClient.delete(`/menus/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menus"] });
        },
        onError: (error) => {
            console.error("Error deleting menu:", error);
        }
    });

    const deleteMenu = async (id) => {
        try {
            return await mutation.mutateAsync(id);
        } catch (error) {
            throw error;
        }
    };

    return { deleteMenu, loading: mutation.isPending };
};
