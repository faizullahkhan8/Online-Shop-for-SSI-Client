export function validPosition(value) {
    if (!value || [value.lat, value.lng].some(v => v === "" || v == null || !["number", "string"].includes(typeof v))) return null;
    const lat = Number(value.lat), lng = Number(value.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}
export const samePosition = (a, b) => {
    const first = validPosition(a), second = validPosition(b);
    return first && second ? Math.abs(first.lat - second.lat) < 0.000001 && Math.abs(first.lng - second.lng) < 0.000001 : !first && !second;
};
export function savedRecipient(user) {
    const address = user?.addresses?.[0] || {};
    return { name: user?.name || "", phone: user?.phone || "",
        ...Object.fromEntries(["street", "addressLine2", "city", "state", "postalCode", "country"].map(key => [key, address[key] || ""])),
        ...(validPosition(address) || { lat: undefined, lng: undefined }) };
}
export function addressFields(data) {
    return { street: data.display_name || "", city: data.address?.city || data.address?.town || data.address?.village || data.address?.state_district || "",
        state: data.address?.state || "", postalCode: data.address?.postcode || "", country: data.address?.country || "" };
}
export async function geocode(kind, value, signal, fetchImpl = fetch) {
    const query = kind === "reverse" ? `reverse?format=json&lat=${value.lat}&lon=${value.lng}` : `search?format=json&limit=1&q=${encodeURIComponent(value)}`;
    const response = await fetchImpl(`https://nominatim.openstreetmap.org/${query}`, { signal });
    if (!response.ok) throw new Error("Address lookup unavailable");
    const data = await response.json();
    return kind === "reverse" ? (data.display_name ? data : null) : validPosition({ lat: data[0]?.lat, lng: data[0]?.lon });
}
