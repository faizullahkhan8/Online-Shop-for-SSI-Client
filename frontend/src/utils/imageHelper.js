export const getImageUrl = (img) => {
    if (!img) return "";
    if (typeof img !== "string") return "";
    if (
        img.startsWith("http://") ||
        img.startsWith("https://") ||
        img.startsWith("blob:") ||
        img.startsWith("data:")
    ) {
        return img;
    }
    const endpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
    if (endpoint) {
        return `${endpoint.replace(/\/+$/, "")}/${img.replace(/^\/+/, "")}`;
    }
    return img;
};
