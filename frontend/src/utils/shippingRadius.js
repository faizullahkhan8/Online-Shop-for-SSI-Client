import { validPosition } from "./location.js";

export function deliveryDistanceKm(store, destination) {
    store = validPosition(store);
    destination = validPosition(destination);
    if (!store || !destination) return null;
    const radians = degrees => Number(degrees) * Math.PI / 180;
    const a = Math.sin(radians(destination.lat - store.lat) / 2) ** 2 +
        Math.cos(radians(store.lat)) * Math.cos(radians(destination.lat)) * Math.sin(radians(destination.lng - store.lng) / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

export function isWithinFreeDeliveryRadius(config, destination) {
    if (!config?.freeDeliveryEnabled) return false;
    const radius = Number(config.freeDeliveryRadiusKm ?? 3);
    const distance = deliveryDistanceKm(config.storeLocation, destination);
    return Number.isFinite(radius) && radius >= 0.01 && distance !== null && distance <= radius + 1e-9;
}
