import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../apiClient.js";

// ─── Get Home Page Config (public) ───────────────────────────────────────────
export const useGetHomePage = () => {
    const { data, isLoading: loading, error, refetch } = useQuery({
        queryKey: ["homepage"],
        queryFn: async () => {
            const res = await apiClient.get("/homepage");
            return res.data; // Return the entire response
        }
    });

    // Provide a backwards-compatible getHomePage function for existing calls 
    // that expect a promise resolving to { sections: [] }
    const getHomePage = async () => {
        const result = await refetch();
        if (result.isError) throw result.error;
        return result.data;
    };

    return { getHomePage, loading, data, error };
};

// ─── Update Home Page Config (admin) ─────────────────────────────────────────
export const useUpdateHomePage = () => {
    const queryClient = useQueryClient();
    
    const mutation = useMutation({
        mutationFn: async (sections) => {
            const res = await apiClient.put("/homepage", { sections });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["homepage"] });
        }
    });

    const updateHomePage = async (sections) => {
        return await mutation.mutateAsync(sections);
    };

    return { updateHomePage, loading: mutation.isPending };
};

// ─── Reset Home Page to Defaults (admin) ─────────────────────────────────────
export const useResetHomePage = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await apiClient.delete("/homepage/reset");
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["homepage"] });
        }
    });

    const resetHomePage = async () => {
        return await mutation.mutateAsync();
    };

    return { resetHomePage, loading: mutation.isPending };
};

export const useUploadHomePageImage = () => {
    const [loading, setLoading] = useState(false);

    const uploadImage = async (file) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);
            
            const res = await apiClient.post("/homepage/upload-image", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return res.data;
        } catch (error) {
            console.error("Error uploading image:", error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const deleteImage = async (fileId) => {
        if (!fileId) return { success: false };
        setLoading(true);
        try {
            const res = await apiClient.delete(`/homepage/delete-image/${fileId}`);
            return res.data;
        } catch (error) {
            console.error("Error deleting image:", error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { uploadImage, deleteImage, loading };
};
