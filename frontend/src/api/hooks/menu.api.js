import { useState, useCallback } from "react";
import apiClient from "../apiClient.js";

export const useGetMenus = () => {
    const [loading, setLoading] = useState(false);

    const getMenus = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get("/menus");
            return response.data;
        } catch (error) {
            console.error("Error fetching menus:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return { getMenus, loading };
};

export const useCreateMenu = () => {
    const [loading, setLoading] = useState(false);

    const createMenu = useCallback(async (menuData) => {
        setLoading(true);
        try {
            const response = await apiClient.post("/menus", menuData);
            return response.data;
        } catch (error) {
            console.error("Error creating menu:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return { createMenu, loading };
};

export const useUpdateMenu = () => {
    const [loading, setLoading] = useState(false);

    const updateMenu = useCallback(async (id, menuData) => {
        setLoading(true);
        try {
            const response = await apiClient.put(`/menus/${id}`, menuData);
            return response.data;
        } catch (error) {
            console.error("Error updating menu:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return { updateMenu, loading };
};

export const useDeleteMenu = () => {
    const [loading, setLoading] = useState(false);

    const deleteMenu = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await apiClient.delete(`/menus/${id}`);
            return response.data;
        } catch (error) {
            console.error("Error deleting menu:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return { deleteMenu, loading };
};
