import { Schema } from "mongoose";

const smsTemplateSchema = new Schema(
    {
        eventName: {
            type: String,
            required: true,
            unique: true,
        },
        messageTemplate: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export default smsTemplateSchema;
