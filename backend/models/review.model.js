import { Schema, SchemaTypes } from "mongoose";

const reviewSchema = new Schema(
    {
        user: {
            type: SchemaTypes.ObjectId,
            ref: "User",
            required: true,
        },
        product: {
            type: SchemaTypes.ObjectId,
            ref: "Product",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

// Prevent multiple reviews from the same user for the same product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

export default reviewSchema;
