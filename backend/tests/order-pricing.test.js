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
