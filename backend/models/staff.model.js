import { Schema, SchemaTypes } from "mongoose";
import { safeHtml } from "../utils/safeHtml.js";

const staffSchema = new Schema(
    {
        name: { type: String, required: true },
        role: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            set: safeHtml,
            default: "",
        },
        image: { type: String, default: "" },
        parentId: {
            type: SchemaTypes.ObjectId,
            ref: "Staff",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default staffSchema;
