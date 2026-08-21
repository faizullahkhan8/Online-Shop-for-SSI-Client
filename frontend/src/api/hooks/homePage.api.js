import { useState, useCallback } from "react";
import apiClient from "../apiClient.js";

// Cache key and TTL (5 minutes)
const CACHE_KEY = "homepage_config";
const CACHE_TTL = 5 * 60 * 1000;

const getCache = () => {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { data, timestamp } = JSON.parse(raw);
        if (Date.now() - timestamp > CACHE_TTL) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
        return data;
    } catch {
        return null;
    }
};

const setCache = (data) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch { /* ignore */ }
};

export const clearHomePageCache = () => {
    try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
};

// ─── Get Home Page Config (public) ───────────────────────────────────────────
export const useGetHomePage = () => {
    const [loading, setLoading] = useState(false);

    const getHomePage = useCallback(async ({ forceRefresh = false } = {}) => {
        // Return from cache unless forced refresh
        if (!forceRefresh) {
            const cached = getCache();
            if (cached) return { success: true, sections: cached, fromCache: true };
        }
        setLoading(true);
        try {
            const res = await apiClient.get("/homepage");
            setCache(res.data.sections);
            return res.data;
        } catch (err) {
            console.error("Error fetching homepage config:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { getHomePage, loading };
};

// ─── Update Home Page Config (admin) ─────────────────────────────────────────
export const useUpdateHomePage = () => {
    const [loading, setLoading] = useState(false);

    const updateHomePage = useCallback(async (sections) => {
        setLoading(true);
        try {
            const res = await apiClient.put("/homepage", { sections });
            clearHomePageCache(); // Bust cache after save
            return res.data;
        } catch (err) {
            console.error("Error updating homepage config:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { updateHomePage, loading };
};

// ─── Reset Home Page to Defaults (admin) ─────────────────────────────────────
export const useResetHomePage = () => {
    const [loading, setLoading] = useState(false);

    const resetHomePage = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.delete("/homepage/reset");
            clearHomePageCache();
            return res.data;
        } catch (err) {
            console.error("Error resetting homepage config:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { resetHomePage, loading };
};
