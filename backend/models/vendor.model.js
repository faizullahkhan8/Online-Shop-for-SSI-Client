import { Schema } from "mongoose";

const vendorSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Vendor name is required"],
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            default: "",
        },
        image: {
            type: String,
            default: "",
        },
        imageFileId: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

export default vendorSchema;
