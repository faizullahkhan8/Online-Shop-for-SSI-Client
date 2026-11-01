import { Schema, SchemaTypes } from "mongoose";
import { safeHtml } from "../utils/safeHtml.js";

const productSchema = new Schema(
    {
        revision: { type: Number, default: 0 },
        isArchived: { type: Boolean, default: false },
        name: { type: String, required: true },
        slug: { type: String, unique: true, sparse: true },
        productType: { type: String, default: "" },
        brand: { type: String, default: "" },
        shortDescription: { type: String, default: "" },
        packSize: { type: String, default: "" },
        tags: [{ type: String }],
        seoTitle: { type: String, default: "" },
        metaDescription: { type: String, default: "" },
        searchKeywords: [{ type: String }],
        researchSources: [{ type: String }],
        imageSources: [{ type: String }],
        vendor: {
            type: SchemaTypes.ObjectId,
            ref: "Vendor",
            default: null
        },
        price: { type: Number, required: true, min: 0, validate: Number.isFinite },
        minPrice: { type: Number },
        maxPrice: { type: Number },
        description: { type: String, required: false },
        details: [
            {
                title: { type: String, required: true },
                contentHTML: { type: String, set: safeHtml },
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
        stock: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
        lowStock: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
        hasVariants: { type: Boolean, default: false },
        variants: [
            {
                name: { type: String, required: true },
                color: { type: String, default: "" },
                sku: { type: String, default: "" },
                price: { type: Number, required: true, min: 0, validate: Number.isFinite },
                stock: { type: Number, default: 0, min: 0, validate: Number.isSafeInteger },
                lowStock: { type: Number, default: 5, min: 0, validate: Number.isSafeInteger },
                imageIndex: { type: Number, default: 0, min: 0, validate: Number.isSafeInteger },
                imageIndices: { type: [{ type: Number, min: 0, validate: Number.isSafeInteger }], default: undefined },
                active: { type: Boolean, default: true },
            },
        ],
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
