import { Schema, SchemaTypes } from "mongoose";

const promotionSchema = new Schema(
    {
        title: { type: String, required: true },
        type: {
            type: String,
            enum: ["FLASH_DEAL", "OFFER"],
            required: true,
        },
        discountType: {
            type: String,
            enum: ["PERCENTAGE", "FIXED_AMOUNT"],
            required: true,
        },
        discountValue: { type: Number, required: true },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        products: [
            {
                type: SchemaTypes.ObjectId,
                ref: "Product",
            },
        ],
        status: {
            type: String,
            enum: ["ACTIVE", "SCHEDULED", "EXPIRED", "CANCELLED", "INACTIVE"],
            default: "SCHEDULED",
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    },
);

export default promotionSchema;
