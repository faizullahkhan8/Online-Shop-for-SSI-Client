import { useQuery } from "@tanstack/react-query";
import apiClient from "../apiClient";
import { ORDER_ROUTES } from "../routes";

export const useDashboardStats = ({ startDate, endDate } = {}) => {
    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["dashboardStats", startDate, endDate],
        queryFn: async () => {
            const params = {};
            if (startDate) params.startDate = startDate.toISOString();
            if (endDate) params.endDate = endDate.toISOString();

            const response = await apiClient.get(ORDER_ROUTES.DASHBOARD_STATS, {
                params,
            });
            if (response.data && response.data.stats) {
                return response.data.stats;
            }
            throw new Error("No stats found");
        },
    });

    return {
        stats: data || null,
        loading,
        error: error ? error.message || "Failed to fetch stats" : null,
    };
};
