import { useState, useCallback } from "react";
import apiClient from "../apiClient.js";

export const useUploadPrescription = () => {
    const [loading, setLoading] = useState(false);

    const uploadPrescription = async (formData) => {
        setLoading(true);
        try {
            const response = await apiClient.post("/prescriptions", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error uploading prescription:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { uploadPrescription, loading };
};

export const useGetAllPrescriptions = () => {
    const [loading, setLoading] = useState(false);

    const getAllPrescriptions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get("/prescriptions");
            return response.data;
        } catch (error) {
            console.error("Error fetching all prescriptions:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return { getAllPrescriptions, loading };
};

export const useGetUserPrescriptions = () => {
    const [loading, setLoading] = useState(false);

    const getUserPrescriptions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get("/prescriptions/my");
            return response.data;
        } catch (error) {
            console.error("Error fetching user prescriptions:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return { getUserPrescriptions, loading };
};

export const useUpdatePrescriptionStatus = () => {
    const [loading, setLoading] = useState(false);

    const updatePrescriptionStatus = async (id, status) => {
        setLoading(true);
        try {
            const response = await apiClient.put(`/prescriptions/${id}/status`, { status });
            return response.data;
        } catch (error) {
            console.error("Error updating prescription status:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { updatePrescriptionStatus, loading };
};

export const useDeletePrescription = () => {
    const [loading, setLoading] = useState(false);

    const deletePrescription = async (id) => {
        setLoading(true);
        try {
            const response = await apiClient.delete(`/prescriptions/${id}`);
            return response.data;
        } catch (error) {
            console.error("Error deleting prescription:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { deletePrescription, loading };
};
