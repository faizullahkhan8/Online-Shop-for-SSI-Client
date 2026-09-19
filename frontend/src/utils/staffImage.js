import { getImageUrl } from "./imageHelper";

// Serve small portraits at display resolution; keep non-ImageKit sources intact.
export function staffImage(member, width = 480) {
    if (!member.image) return "/assets/images/zada-logo.webp";
    const source = getImageUrl(member.image);
    try {
        const url = new URL(source);
        if (url.hostname === "ik.imagekit.io") {
            url.searchParams.set("tr", `w-${width},q-80,f-auto`);
            return url.toString();
        }
    } catch { /* Local images use their existing path. */ }
    return source;
}
