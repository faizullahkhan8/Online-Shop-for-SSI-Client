import { Schema } from "mongoose";

const menuSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["CATEGORY", "CUSTOM_LINK", "PAGE"],
            default: "CUSTOM_LINK",
        },
        link: {
            type: String,
            required: true,
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: "Menu",
            default: null,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

export default menuSchema;
