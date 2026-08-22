import { Schema, SchemaTypes } from "mongoose";

const productSchema = new Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, unique: true, sparse: true },
        productType: { type: String, default: "" },
        vendor: { 
            type: SchemaTypes.ObjectId, 
            ref: "Vendor", 
            default: null 
        },
        price: { type: Number, required: true },
        minPrice: { type: Number },
        maxPrice: { type: Number },
        description: { type: String, required: false },
        details: [
            {
                title: { type: String, required: true },
                contentHTML: { type: String },
                contentJSON: { type: String },
            }
        ],
        badges: [{ type: String }],
        sold: { type: Number, default: 0 },
        category: {
            type: SchemaTypes.ObjectId,
            ref: "Category",
            required: true,
        },
        stock: { type: Number, required: true },
        lowStock: { type: Number, required: true },
        // Legacy single image support
        image: { type: String, required: false },
        imagekitFileId: { type: String, required: false },
        // Multi-image support
        images: [
            {
                url: { type: String, required: true },
                filePath: { type: String, required: true },
                fileId: { type: String, required: true },
            }
        ],
        rating: { type: Number, default: 0 },
        numReviews: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    },
);

export default productSchema;
