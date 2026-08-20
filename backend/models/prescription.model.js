import { Schema } from "mongoose";

const prescriptionSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        address: {
            text: { type: String, default: "" },
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        image: {
            type: String,
            required: true,
        },
        imagekitFileId: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "rejected"],
            default: "pending",
        },
        notes: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

export default prescriptionSchema;
