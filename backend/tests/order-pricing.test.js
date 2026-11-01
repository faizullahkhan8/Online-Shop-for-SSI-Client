import { it } from "node:test";
import assert from "node:assert/strict";
import { calculateOrderCharges, customerPaymentMethod } from "../utils/orderPricing.js";

it("calculates configured flat, percentage and city shipping", () => {
    assert.deepEqual(calculateOrderCharges({ taxAmount: 20, shippingFee: 150 }, 100, {}),
        { taxAmount: 20, shippingFee: 150, shippingMethod: "standard" });
    assert.equal(calculateOrderCharges({ advancedShipping: { calculationMethod: "percentage", percentageRate: 5 } }, 1200, {}).shippingFee, 60);
    const settings = { shippingFee: 150, advancedShipping: { calculationMethod: "city_based", cityRates: [{ city: "Bannu", fee: 80 }] } };
    assert.equal(calculateOrderCharges(settings, 100, { city: "Bannu District" }).shippingFee, 80);
    assert.equal(calculateOrderCharges(settings, 100, { city: "Lahore" }).shippingFee, 150);
});
it("applies delivery thresholds and configured pickup", () => {
    const settings = { shippingFee: 150, advancedShipping: { conditionalOverride: {
        enabled: true, operator: "greater_than", orderValueThreshold: 1000, overrideFee: 0 } } };
    assert.equal(calculateOrderCharges(settings, 1001, {}).shippingFee, 0);
    assert.equal(calculateOrderCharges(settings, 1000, {}).shippingFee, 150);
    assert.equal(calculateOrderCharges({ ...settings, shippingMethod: "pickup" }, 100, {}).shippingFee, 0);
});
it("calculates distance charges with zero coordinates and rejects missing coordinates", () => {
    const settings = { advancedShipping: { calculationMethod: "distance", storeLocation: { lat: 0, lng: 0 }, distanceRatePerKm: 2 } };
    assert.equal(calculateOrderCharges(settings, 100, { lat: 0, lng: 1 }).shippingFee, 222);
    assert.throws(() => calculateOrderCharges(settings, 100, {}), /valid delivery location/);
});
it("accepts configured methods and the COD fallback while rejecting disabled methods", () => {
    assert.equal(customerPaymentMethod({}, "COD"), "COD");
    const settings = { paymentMethods: [{ title: "Cash on Delivery", isActive: true }, { title: "Bank", isActive: false }] };
    assert.equal(customerPaymentMethod(settings, "COD"), "Cash on Delivery");
    assert.throws(() => customerPaymentMethod(settings, "Bank"), /available payment method/);
});

const atKm = distance => ({ lat: distance * 180 / (6371 * Math.PI), lng: 0 });
it("offers free delivery inside and on a configurable radius across every shipping method", () => {
    for (const calculationMethod of ["flat", "distance", "percentage", "city_based"]) {
        const settings = { shippingFee: 150, advancedShipping: { calculationMethod, storeLocation: { lat: 0, lng: 0 },
            freeDeliveryEnabled: true, freeDeliveryRadiusKm: 3, distanceRatePerKm: 50, percentageRate: 10,
            cityRates: [{ city: "Bannu", fee: 100 }] } };
        for (const km of [0, 2.999, 3]) assert.equal(calculateOrderCharges(settings, 1000, { ...atKm(km), city: "Bannu" }).shippingFee, 0, calculationMethod);
        assert.ok(calculateOrderCharges(settings, 1000, { ...atKm(3.001), city: "Bannu" }).shippingFee > 0, calculationMethod);
        settings.advancedShipping.freeDeliveryRadiusKm = 5;
        assert.equal(calculateOrderCharges(settings, 1000, atKm(4)).shippingFee, 0);
    }
});
it("keeps radius delivery free despite paid overrides and preserves outside and disabled rules", () => {
    const settings = { shippingFee: 150, advancedShipping: { calculationMethod: "flat", freeDeliveryEnabled: true,
        freeDeliveryRadiusKm: 3, storeLocation: { lat: 0, lng: 0 }, conditionalOverride: { enabled: true, operator: "greater_than", orderValueThreshold: 100, overrideFee: 50 } } };
    assert.equal(calculateOrderCharges(settings, 200, atKm(1)).shippingFee, 0);
    assert.equal(calculateOrderCharges(settings, 200, atKm(4)).shippingFee, 50);
    settings.advancedShipping.freeDeliveryEnabled = false;
    assert.equal(calculateOrderCharges(settings, 200, {}).shippingFee, 50);
    settings.advancedShipping.freeDeliveryEnabled = true;
    assert.equal(calculateOrderCharges({ ...settings, shippingMethod: "pickup" }, 200, {}).shippingFee, 0);
});
it("rejects missing delivery pins, invalid origins and invalid radius configuration", () => {
    const settings = { shippingFee: 150, advancedShipping: { freeDeliveryEnabled: true, freeDeliveryRadiusKm: 3, storeLocation: { lat: 0, lng: 0 } } };
    for (const recipient of [{}, { lat: null, lng: 0 }, { lat: false, lng: 0 }, { lat: 91, lng: 0 }]) assert.throws(() => calculateOrderCharges(settings, 100, recipient), /valid delivery location/);
    for (const radius of [0, -1, "", NaN, Infinity]) {
        settings.advancedShipping.freeDeliveryRadiusKm = radius;
        assert.throws(() => calculateOrderCharges(settings, 100, atKm(1)), /radius/);
    }
    settings.advancedShipping.freeDeliveryRadiusKm = 3;
    settings.advancedShipping.storeLocation = { lat: 0, lng: 181 };
    assert.throws(() => calculateOrderCharges(settings, 100, atKm(1)), /valid delivery location/);
});
