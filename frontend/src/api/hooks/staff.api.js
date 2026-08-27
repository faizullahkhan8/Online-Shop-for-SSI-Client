import { useState, useCallback } from "react";
import apiClient from "../apiClient";
import { toast } from "react-toastify";

const STAFF_ROUTES = {
    GET_ALL: "/staff",
    CREATE: "/staff",
    UPDATE: (id) => `/staff/${id}`,
    DELETE: (id) => `/staff/${id}`,
};

export const useGetStaff = () => {
    const [loading, setLoading] = useState(false);

    const getStaff = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(STAFF_ROUTES.GET_ALL);
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error("Error fetching staff:", error);
            toast.error(error.response?.data?.message || "Failed to fetch staff.");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return { getStaff, loading };
};

export const useCreateStaff = () => {
    const [loading, setLoading] = useState(false);

    const createStaff = async (staffData) => {
        setLoading(true);
        try {
            const config = staffData instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
            const response = await apiClient.post(STAFF_ROUTES.CREATE, staffData, config);
            if (response.data && response.data.success) {
                toast.success("Staff node created successfully");
                return response.data.data;
            }
        } catch (error) {
            console.error("Error creating staff:", error);
            toast.error(error.response?.data?.message || "Failed to create staff node.");
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { createStaff, loading };
};

export const useUpdateStaff = () => {
    const [loading, setLoading] = useState(false);

    const updateStaff = async (id, staffData) => {
        setLoading(true);
        try {
            const config = staffData instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
            const response = await apiClient.put(STAFF_ROUTES.UPDATE(id), staffData, config);
            if (response.data && response.data.success) {
                toast.success("Staff node updated successfully");
                return response.data.data;
            }
        } catch (error) {
            console.error("Error updating staff:", error);
            toast.error(error.response?.data?.message || "Failed to update staff node.");
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { updateStaff, loading };
};

export const useDeleteStaff = () => {
    const [loading, setLoading] = useState(false);

    const deleteStaff = async (id) => {
        setLoading(true);
        try {
            const response = await apiClient.delete(STAFF_ROUTES.DELETE(id));
            if (response.data && response.data.success) {
                toast.success("Staff node deleted successfully");
                return true;
            }
        } catch (error) {
            console.error("Error deleting staff:", error);
            toast.error(error.response?.data?.message || "Failed to delete staff node.");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { deleteStaff, loading };
};
