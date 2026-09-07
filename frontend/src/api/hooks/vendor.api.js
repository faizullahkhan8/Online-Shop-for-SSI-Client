import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../apiClient.js";

// Get All Vendors
export const useGetAllVendors = () => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["vendors"],
        queryFn: async () => {
            const res = await apiClient.get("/vendors");
            return res.data;
        }
    });

    const getAllVendors = async () => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["vendors"],
                queryFn: async () => {
                    const res = await apiClient.get("/vendors");
                    return res.data;
                }
            });
        } catch (error) {
            console.error("Error fetching vendors:", error);
            throw error;
        }
    };

    return { getAllVendors, data, loading, error };
};

// Create Vendor
export const useCreateVendor = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const res = await apiClient.post("/vendors", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendors"] });
        },
        onError: (error) => {
            console.error("Error creating vendor:", error);
        }
    });

    const createVendor = async (data) => {
        try {
            return await mutation.mutateAsync(data);
        } catch (error) {
            throw error;
        }
    };

    return { createVendor, loading: mutation.isPending };
};

// Update Vendor
export const useUpdateVendor = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await apiClient.put(`/vendors/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendors"] });
        },
        onError: (error) => {
            console.error("Error updating vendor:", error);
        }
    });

    const updateVendor = async (id, data) => {
        try {
            return await mutation.mutateAsync({ id, data });
        } catch (error) {
            throw error;
        }
    };

    return { updateVendor, loading: mutation.isPending };
};

// Delete Vendor
export const useDeleteVendor = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (id) => {
            const res = await apiClient.delete(`/vendors/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendors"] });
        },
        onError: (error) => {
            console.error("Error deleting vendor:", error);
        }
    });

    const deleteVendor = async (id) => {
        try {
            return await mutation.mutateAsync(id);
        } catch (error) {
            throw error;
        }
    };

    return { deleteVendor, loading: mutation.isPending };
};

// Upload Vendor Image
export const useUploadVendorImage = () => {
    const mutation = useMutation({
        mutationFn: async (file) => {
            const formData = new FormData();
            formData.append("image", file);
            const res = await apiClient.post("/vendors/upload-image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data;
        },
        onError: (error) => {
            console.error("Error uploading vendor image:", error);
        }
    });

    const uploadImage = async (file) => {
        try {
            return await mutation.mutateAsync(file);
        } catch (error) {
            throw error;
        }
    };

    return { uploadImage, loading: mutation.isPending };
};

// Delete Vendor Image
export const useDeleteVendorImage = () => {
    const mutation = useMutation({
        mutationFn: async (fileId) => {
            if (!fileId) return;
            const res = await apiClient.delete(`/vendors/delete-image/${fileId}`);
            return res.data;
        },
        onError: (error) => {
            console.error("Error deleting vendor image:", error);
        }
    });

    const deleteImage = async (fileId) => {
        try {
            return await mutation.mutateAsync(fileId);
        } catch (error) {
            throw error;
        }
    };

    return { deleteImage, loading: mutation.isPending };
};
