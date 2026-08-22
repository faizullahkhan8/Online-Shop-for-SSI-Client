import { Schema } from "mongoose";

const settingsSchema = new Schema(
    {
        taxAmount: {
            type: Number,
            default: 0,
        },
        shippingFee: {
            type: Number,
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
                lat: { type: Number, default: 24.8607 }, // Default Karachi
                lng: { type: Number, default: 67.0011 },
                address: { type: String, default: "" }
            },
            distanceRatePerKm: { type: Number, default: 50 },
            percentageRate: { type: Number, default: 5 },
            cityRates: [
                { city: { type: String }, fee: { type: Number } }
            ],
            conditionalOverride: {
                enabled: { type: Boolean, default: false },
                operator: { type: String, enum: ["greater_than", "less_than"], default: "greater_than" },
                orderValueThreshold: { type: Number, default: 1000 },
                overrideFee: { type: Number, default: 0 }
            }
        }
    },
    {
        timestamps: true,
    },
);

export default settingsSchema;
