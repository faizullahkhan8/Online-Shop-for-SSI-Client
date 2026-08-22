export const PLACEHOLDERS = {
    product: "https://placehold.co/400x400/F2F8ED/7ec142?text=Product+Image",
    banner: "https://placehold.co/1200x400/F2F8ED/7ec142?text=Banner+Image",
    carousel: "https://placehold.co/1200x600/F2F8ED/7ec142?text=Slide",
    avatar: "https://placehold.co/200x200/F2F8ED/7ec142?text=User",
    vendor: "https://placehold.co/200x200/F2F8ED/7ec142?text=Vendor",
    category: "https://placehold.co/300x300/F2F8ED/7ec142?text=Category",
    default: "https://placehold.co/400x400/F2F8ED/7ec142?text=No+Image"
};

export const getImageUrl = (img, type = "default") => {
    if (!img) return PLACEHOLDERS[type] || PLACEHOLDERS.default;
    if (typeof img !== "string") return PLACEHOLDERS[type] || PLACEHOLDERS.default;
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

export const handleImageError = (e, type = "default") => {
    e.target.onerror = null;
    e.target.src = PLACEHOLDERS[type] || PLACEHOLDERS.default;
};
