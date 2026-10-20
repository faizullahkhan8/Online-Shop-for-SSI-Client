import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SETTINGS_ROUTES } from "../routes";
import apiClient from "../apiClient.js";
import { toast } from "react-toastify";

export const useGetSettings = ({ admin = false } = {}) => {
    const queryClient = useQueryClient();
    const queryKey = ["settings", admin ? "admin" : "public"];
    const url = admin ? `${SETTINGS_ROUTES.GET}/admin` : SETTINGS_ROUTES.GET;

    const { data, isLoading: loading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            const response = await apiClient.get(url);
            return response.data;
        }
    });

    const getSettings = async () => {
        try {
            return await queryClient.fetchQuery({
                queryKey,
                queryFn: async () => {
                    const response = await apiClient.get(url);
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
        } catch {
            // error is handled by mutation onError
        }
    };

    return { updateSettings, loading: mutation.isPending };
};

export const useSmsTools = () => {
    const queryClient = useQueryClient();
    const attempts = useQuery({ queryKey: ["sms-attempts"],
        queryFn: async () => (await apiClient.get(`${SETTINGS_ROUTES.GET}/sms/attempts`)).data });
    const test = useMutation({
        mutationFn: async (draft) => (await apiClient.post(`${SETTINGS_ROUTES.GET}/sms/test`, draft)).data,
        onSuccess: data => toast.success(data.message),
        onError: error => toast.error(error.response?.data?.message || "Could not send the test SMS."),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["sms-attempts"] }),
    });
    return { attempts: attempts.data?.attempts || [], attemptsError: attempts.error,
        sendTest: test.mutate, testing: test.isPending };
};
