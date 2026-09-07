import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import apiClient from "../apiClient";
import { SMS_TEMPLATE_ROUTES } from "../routes";

export const useSmsTemplates = () => {
    const queryClient = useQueryClient();

    const { data: templates = [], isLoading: fetchLoading, refetch: fetchTemplates } = useQuery({
        queryKey: ["sms-templates"],
        queryFn: async () => {
            const response = await apiClient.get(SMS_TEMPLATE_ROUTES.GET_ALL);
            if (response.data && response.data.templates) {
                return response.data.templates;
            }
            return [];
        },
        onError: (error) => {
            console.error("Error fetching SMS templates:", error);
            toast.error("Failed to fetch SMS templates");
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await apiClient.put(`${SMS_TEMPLATE_ROUTES.UPDATE}/${id}`, data);
            return response.data.template;
        },
        onSuccess: () => {
            toast.success("SMS template updated successfully");
            queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
        },
        onError: (error) => {
            console.error("Error updating SMS template:", error);
            toast.error("Failed to update SMS template");
        }
    });

    const seedMutation = useMutation({
        mutationFn: async () => {
            const response = await apiClient.post(SMS_TEMPLATE_ROUTES.SEED);
            return response.data.templates;
        },
        onSuccess: () => {
            toast.success("SMS templates seeded successfully");
            queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
        },
        onError: (error) => {
            console.error("Error seeding SMS templates:", error);
            toast.error("Failed to seed SMS templates");
        }
    });

    const updateTemplate = async (id, data) => {
        try {
            return await updateMutation.mutateAsync({ id, data });
        } catch {
            return null;
        }
    };

    const seedTemplates = async () => {
        try {
            return await seedMutation.mutateAsync();
        } catch {
            return null;
        }
    };

    return {
        loading: fetchLoading || updateMutation.isPending || seedMutation.isPending,
        templates,
        fetchTemplates,
        updateTemplate,
        seedTemplates
    };
};
