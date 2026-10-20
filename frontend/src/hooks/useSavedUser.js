import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useGetUser } from "../api/hooks/user.api.js";
import { toast } from "react-toastify";

export function useSavedUser() {
    const account = useSelector(state => state.auth.user);
    const { data, error, fetchedAfterMount } = useGetUser(account?._id || null);
    useEffect(() => {
        if (error) toast.error("Could not load your latest saved address. Check the address before submitting.");
    }, [error]);
    if (!account) return null;
    if (error) return account;
    return fetchedAfterMount ? data?.user || null : null;
}
