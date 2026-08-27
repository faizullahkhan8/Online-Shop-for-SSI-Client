import { useState, useCallback } from "react";
import apiClient from "../apiClient.js";

// Get All Vendors
export const useGetAllVendors = () => {
    const [loading, setLoading] = useState(false);

    const getAllVendors = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get("/vendors");
            return res.data;
        } catch (error) {
            console.error("Error fetching vendors:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return { getAllVendors, loading };
};

// Create Vendor
export const useCreateVendor = () => {
    const [loading, setLoading] = useState(false);

    const createVendor = useCallback(async (data) => {
        setLoading(true);
        try {
            const res = await apiClient.post("/vendors", data);
            return res.data;
        } catch (error) {
            console.error("Error creating vendor:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return { createVendor, loading };
};

// Update Vendor
export const useUpdateVendor = () => {
    const [loading, setLoading] = useState(false);

    const updateVendor = useCallback(async (id, data) => {
        setLoading(true);
        try {
            const res = await apiClient.put(`/vendors/${id}`, data);
            return res.data;
        } catch (error) {
            console.error("Error updating vendor:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return { updateVendor, loading };
};

// Delete Vendor
export const useDeleteVendor = () => {
    const [loading, setLoading] = useState(false);

    const deleteVendor = useCallback(async (id) => {
        setLoading(true);
        try {
            const res = await apiClient.delete(`/vendors/${id}`);
            return res.data;
        } catch (error) {
            console.error("Error deleting vendor:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return { deleteVendor, loading };
};

// Upload Vendor Image
export const useUploadVendorImage = () => {
    const [loading, setLoading] = useState(false);
    
    const uploadImage = useCallback(async (file) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);
            const res = await apiClient.post("/vendors/upload-image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data;
        } catch (error) {
            console.error("Error uploading vendor image:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return { uploadImage, loading };
};

// Delete Vendor Image
export const useDeleteVendorImage = () => {
    const [loading, setLoading] = useState(false);
    
    const deleteImage = useCallback(async (fileId) => {
        if (!fileId) return;
        setLoading(true);
        try {
            const res = await apiClient.delete(`/vendors/delete-image/${fileId}`);
            return res.data;
        } catch (error) {
            console.error("Error deleting vendor image:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return { deleteImage, loading };
};

