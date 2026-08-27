import { useState, useEffect } from "react";
import apiClient from "../apiClient";
import { ORDER_ROUTES } from "../routes";

export const useDashboardStats = ({ startDate, endDate } = {}) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (startDate) params.startDate = startDate.toISOString();
            if (endDate) params.endDate = endDate.toISOString();

            const response = await apiClient.get(ORDER_ROUTES.DASHBOARD_STATS, {
                params,
            });
            if (response.data && response.data.stats) {
                setStats(response.data.stats);
            } else {
                setError("No stats found");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch stats");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [startDate, endDate]);

    return { stats, loading, error };
};
