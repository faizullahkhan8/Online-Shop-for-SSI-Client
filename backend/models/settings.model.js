import { Schema } from "mongoose";

const settingsSchema = new Schema(
    {
        taxAmount: {
            type: Number,
            min: 0, validate: Number.isFinite,
            default: 0,
        },
        shippingFee: {
            type: Number,
            min: 0, validate: Number.isFinite,
            default: 0,
        },
        shippingMethod: {
            type: String,
            default: "standard",
        },
        paymentMethods: [
            {
                title: { type: String, required: true },
                information: { type: String },
                image: { type: String }, // ImageKit URL or path
                imagekitFileId: { type: String },
                isActive: { type: Boolean, default: true },
            }
        ],
        advancedShipping: {
            calculationMethod: { type: String, enum: ["flat", "distance", "percentage", "city_based"], default: "flat" },
            storeLocation: {
                lat: { type: Number, min: -90, max: 90, validate: Number.isFinite, default: 24.8607 }, // Default Karachi
                lng: { type: Number, min: -180, max: 180, validate: Number.isFinite, default: 67.0011 },
                address: { type: String, default: "" }
            },
            freeDeliveryEnabled: { type: Boolean, default: false },
            freeDeliveryRadiusKm: { type: Number, min: 0.01, validate: Number.isFinite, default: 3 },
            distanceRatePerKm: { type: Number, min: 0, validate: Number.isFinite, default: 50 },
            percentageRate: { type: Number, min: 0, validate: Number.isFinite, default: 5 },
            cityRates: [
                { city: { type: String }, fee: { type: Number, min: 0, validate: Number.isFinite } }
            ],
            conditionalOverride: {
                enabled: { type: Boolean, default: false },
                operator: { type: String, enum: ["greater_than", "less_than"], default: "greater_than" },
                orderValueThreshold: { type: Number, min: 0, validate: Number.isFinite, default: 1000 },
                overrideFee: { type: Number, min: 0, validate: Number.isFinite, default: 0 }
            }
        },
        smsProvider: { type: String, match: /^[a-z][a-z0-9_]{0,63}$/, default: "sms_gate" },
        smsConfigurations: { type: Map, of: new Schema({ values: { type: Map, of: String, default: () => new Map() } }, { _id: false }), default: () => new Map() },
        smsTwilioAccountSid: { type: String, default: "" },
        smsTwilioAuthToken: { type: String, default: "" },
        smsTwilioFrom: { type: String, default: "" },
        smsLastTestAt: { type: Date },
        smsGatewayUsername: {
            type: String,
            default: "",
        },
        smsGatewayPassword: {
            type: String,
            default: "",
        }
    },
    {
        timestamps: true,
    },
);

export default settingsSchema;
