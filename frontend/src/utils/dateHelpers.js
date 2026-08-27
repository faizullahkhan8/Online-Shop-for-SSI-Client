/**
 * Date utility functions for dashboard date range filtering
 */

export const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

export const getEndOfToday = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
};

export const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return yesterday;
};

export const getEndOfYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    return yesterday;
};

export const getLastNDays = (n) => {
    const date = new Date();
    date.setDate(date.getDate() - n);
    date.setHours(0, 0, 0, 0);
    return date;
};

export const getStartOfMonth = () => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
};

export const getEndOfMonth = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 0); // Last day of current month
    date.setHours(23, 59, 59, 999);
    return date;
};

export const getStartOfLastMonth = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
};

export const getEndOfLastMonth = () => {
    const date = new Date();
    date.setDate(0); // Last day of previous month
    date.setHours(23, 59, 59, 999);
    return date;
};

export const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const options = { month: "short", day: "numeric", year: "numeric" };
    const startStr = start.toLocaleDateString("en-US", options);
    const endStr = end.toLocaleDateString("en-US", options);

    // If same date, just show once
    if (start.toDateString() === end.toDateString()) {
        return startStr;
    }

    return `${startStr} - ${endStr}`;
};

export const formatDateForInput = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const getDateRangeFromPreset = (preset) => {

    switch (preset) {
        case "today":
            return { startDate: getToday(), endDate: getEndOfToday() };
        case "yesterday":
            return { startDate: getYesterday(), endDate: getEndOfYesterday() };
        case "last7days":
            return { startDate: getLastNDays(7), endDate: getEndOfToday() };
        case "last30days":
            return { startDate: getLastNDays(30), endDate: getEndOfToday() };
        case "thismonth":
            return { startDate: getStartOfMonth(), endDate: getEndOfToday() };
        case "lastmonth":
            return {
                startDate: getStartOfLastMonth(),
                endDate: getEndOfLastMonth(),
            };
        default:
            // Default to last 30 days
            return { startDate: getLastNDays(30), endDate: getEndOfToday() };
    }
};
