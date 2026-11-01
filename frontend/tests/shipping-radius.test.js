import { it } from "node:test";
import assert from "node:assert/strict";
import { deliveryDistanceKm, isWithinFreeDeliveryRadius } from "../src/utils/shippingRadius.js";
import { calculateOrderCharges } from "../../backend/utils/orderPricing.js";

it("matches the server radius decision at zero, inside, exact boundary and outside", () => {
    const config = { freeDeliveryEnabled: true, freeDeliveryRadiusKm: 3, storeLocation: { lat: 0, lng: 0 } };
    for (const km of [0, 2.999, 3, 3.001, 4, 100]) {
        const destination = { lat: km * 180 / (6371 * Math.PI), lng: 0 };
        assert.ok(Math.abs(deliveryDistanceKm(config.storeLocation, destination) - km) < 1e-9);
        assert.equal(isWithinFreeDeliveryRadius(config, destination), calculateOrderCharges({ shippingFee: 150, advancedShipping: config }, 100, destination).shippingFee === 0);
    }
    config.freeDeliveryRadiusKm = 5;
    assert.equal(isWithinFreeDeliveryRadius(config, { lat: 0.04, lng: 0 }), true);
});
it("does not advertise free delivery for disabled, missing or invalid radius inputs", () => {
    const config = { freeDeliveryEnabled: true, freeDeliveryRadiusKm: 3, storeLocation: { lat: 0, lng: 0 } };
    for (const pin of [null, {}, { lat: 91, lng: 0 }]) assert.equal(isWithinFreeDeliveryRadius(config, pin), false);
    for (const radius of [0, -1, "", Infinity, NaN]) assert.equal(isWithinFreeDeliveryRadius({ ...config, freeDeliveryRadiusKm: radius }, { lat: 0, lng: 0 }), false);
    assert.equal(isWithinFreeDeliveryRadius({ ...config, freeDeliveryEnabled: false }, { lat: 0, lng: 0 }), false);
});
