import { useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../apiClient";
import { SMS_TEMPLATE_ROUTES } from "../routes";

export const useSmsTemplates = () => {
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(SMS_TEMPLATE_ROUTES.GET_ALL);
            if (response.data && response.data.templates) {
                setTemplates(response.data.templates);
            }
        } catch (error) {
            console.error("Error fetching SMS templates:", error);
            toast.error("Failed to fetch SMS templates");
        } finally {
            setLoading(false);
        }
    };

    const updateTemplate = async (id, data) => {
        setLoading(true);
        try {
            const response = await apiClient.put(`${SMS_TEMPLATE_ROUTES.UPDATE}/${id}`, data);
            if (response.data && response.data.template) {
                toast.success("SMS template updated successfully");
                setTemplates(prev => prev.map(t => t._id === id ? response.data.template : t));
                return response.data.template;
            }
        } catch (error) {
            console.error("Error updating SMS template:", error);
            toast.error("Failed to update SMS template");
        } finally {
            setLoading(false);
        }
    };

    const seedTemplates = async () => {
        setLoading(true);
        try {
            const response = await apiClient.post(SMS_TEMPLATE_ROUTES.SEED);
            if (response.data && response.data.templates) {
                toast.success("SMS templates seeded successfully");
                setTemplates(response.data.templates);
            }
        } catch (error) {
            console.error("Error seeding SMS templates:", error);
            toast.error("Failed to seed SMS templates");
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        templates,
        fetchTemplates,
        updateTemplate,
        seedTemplates
    };
};
