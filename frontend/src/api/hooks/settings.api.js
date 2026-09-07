import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SETTINGS_ROUTES } from "../routes";
import apiClient from "../apiClient.js";
import { toast } from "react-toastify";

export const useGetSettings = () => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["settings"],
        queryFn: async () => {
            const response = await apiClient.get(SETTINGS_ROUTES.GET);
            return response.data;
        }
    });

    const getSettings = async () => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["settings"],
                queryFn: async () => {
                    const response = await apiClient.get(SETTINGS_ROUTES.GET);
                    return response.data;
                }
            });
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || "Failed to fetch settings";
            toast.error(errorMessage);
            console.log("Error in get settings: ", error.message);
        }
    };

    return { getSettings, loading, data, error };
};

export const useUpdateSettings = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (settings) => {
            const response = await apiClient.put(
                SETTINGS_ROUTES.UPDATE,
                settings,
            );
            return response.data;
        },
        onSuccess: () => {
            toast.success("Settings updated.");
            queryClient.invalidateQueries({ queryKey: ["settings"] });
        },
        onError: (error) => {
            const errorMessage =
                error.response?.data?.message || "Failed to update settings";
            toast.error(errorMessage);
            console.log("Error in update settings: ", error.message);
        }
    });

    const updateSettings = async (settings) => {
        try {
            return await mutation.mutateAsync(settings);
        } catch (error) {
            // error is handled by mutation onError
        }
    };

    return { updateSettings, loading: mutation.isPending };
};
