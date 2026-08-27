import { Schema } from "mongoose";

const heroSlideSchema = new Schema(
    {
        image: {
            type: String,
            required: true,
        },
        imagekitFileId: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
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

export default heroSlideSchema;
