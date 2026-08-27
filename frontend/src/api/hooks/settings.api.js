import { useState } from "react";
import { SETTINGS_ROUTES } from "../routes";
import apiClient from "../apiClient.js";
import { toast } from "react-toastify";

export const useGetSettings = () => {
    const [loading, setLoading] = useState(false);

    const getSettings = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(SETTINGS_ROUTES.GET);
            if (response.data) return response.data;
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || "Failed to fetch settings";
            toast.error(errorMessage);
            console.log("Error in get settings: ", error.message);
        } finally {
            setLoading(false);
        }
    };

    return { getSettings, loading };
};

export const useUpdateSettings = () => {
    const [loading, setLoading] = useState(false);

    const updateSettings = async (settings) => {
        try {
            setLoading(true);
            const response = await apiClient.put(
                SETTINGS_ROUTES.UPDATE,
                settings,
            );
            if (response.data) {
                toast.success("Settings updated.");
                return response.data;
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || "Failed to update settings";
            toast.error(errorMessage);
            console.log("Error in update settings: ", error.message);
        } finally {
            setLoading(false);
        }
    };

    return { updateSettings, loading };
};
