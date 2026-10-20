import { ErrorResponse } from "./ErrorResponse.js";

export const money = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export const nonNegativeAmount = (value, name) => {
    const amount = Number(value);
    if (!["number", "string"].includes(typeof value) || value === "" ||
        !Number.isFinite(amount) || amount < 0) {
        throw new ErrorResponse(`${name} must be a finite non-negative amount`, 400);
    }
    return amount;
};

const coordinate = (value, limit) => value !== null && value !== undefined &&
    value !== "" && Number.isFinite(Number(value)) && Math.abs(Number(value)) <= limit;

const normalizeCity = (city) => String(city || "").toLowerCase()
    .replace(/\b(division|district|city|tehsil|town|cantt|cantonment)\b/g, "")
    .replace(/\s+/g, " ").trim();

export const calculateOrderCharges = (settings, subtotal, recipient) => {
    const taxAmount = money(nonNegativeAmount(settings.taxAmount ?? 0, "Tax"));
    const shippingMethod = settings.shippingMethod || "standard";
    let shippingFee = nonNegativeAmount(settings.shippingFee ?? 0, "Shipping");
    const config = settings.advancedShipping;

    if (config?.calculationMethod === "percentage") {
        shippingFee = subtotal * nonNegativeAmount(config.percentageRate ?? 0, "Shipping rate") / 100;
    } else if (config?.calculationMethod === "city_based") {
        const city = normalizeCity(recipient.city);
        const rule = config.cityRates?.find((entry) => {
            const candidate = normalizeCity(entry.city);
            return city && candidate && (city === candidate || city.includes(candidate) || candidate.includes(city));
        });
        if (rule) shippingFee = nonNegativeAmount(rule.fee, "City shipping fee");
    } else if (config?.calculationMethod === "distance" && shippingMethod !== "pickup") {
        const store = config.storeLocation;
        if (!coordinate(store?.lat, 90) || !coordinate(store?.lng, 180) ||
            !coordinate(recipient.lat, 90) || !coordinate(recipient.lng, 180)) {
            throw new ErrorResponse("A valid delivery location is required for distance shipping", 400);
        }
        const radians = (degrees) => Number(degrees) * Math.PI / 180;
        const dLat = radians(recipient.lat - store.lat);
        const dLng = radians(recipient.lng - store.lng);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(store.lat)) *
            Math.cos(radians(recipient.lat)) * Math.sin(dLng / 2) ** 2;
        const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
        shippingFee = distance * nonNegativeAmount(config.distanceRatePerKm ?? 0, "Distance shipping rate");
    }

    const override = config?.conditionalOverride;
    if (override?.enabled) {
        const threshold = nonNegativeAmount(override.orderValueThreshold ?? 0, "Shipping threshold");
        if ((override.operator === "greater_than" && subtotal > threshold) ||
            (override.operator === "less_than" && subtotal < threshold)) {
            shippingFee = nonNegativeAmount(override.overrideFee ?? 0, "Shipping override");
        }
    }
    return { taxAmount, shippingMethod, shippingFee: shippingMethod === "pickup" ? 0 : Math.round(shippingFee) };
};

export const customerPaymentMethod = (settings, requestedMethod) => {
    const methods = (settings.paymentMethods || []).filter((method) => method.isActive !== false);
    const requested = String(requestedMethod || "").trim();
    const available = methods.length ? methods.map((method) => method.title) : ["COD"];
    const canonical = (method) => method.trim().toLowerCase().replace(/^cash on delivery$/, "cod");
    const matched = available.find((method) => canonical(method) === canonical(requested));
    if (!matched) throw new ErrorResponse("Select an available payment method", 400);
    return matched;
};
