import { Schema, SchemaTypes, Types } from "mongoose";

const orderSchema = new Schema(
    {
        businessMigrationVersion: Number,
        legacyPaymentProvenanceUnknown: Boolean,
        currency: { type: String, default: "PKR" },
        pricingVersion: { type: String },
        history: [{ action: String, actor: Schema.Types.ObjectId, at: Date, from: String, to: String, reference: String, reason: String }],
        checkoutKey: { type: String, select: false },
        checkoutHash: { type: String, select: false },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        recipient: {
            name: {
                type: String,
                required: true,
            },
            street: {
                type: String,
                required: true,
            },
            addressLine2: {
                type: String,
                default: "",
            },
            city: {
                type: String,
                required: true,
            },
            state: {
                type: String,
                default: "",
            },
            postalCode: {
                type: String,
                default: "",
            },
            country: {
                type: String,
                default: "",
            },
            phone: {
                type: String,
                required: true,
            },
            lat: {
                type: Number,
            },
            lng: {
                type: Number,
            },
        },
        items: [
            {
                product: {
                    type: Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
                snapshotSource: { type: String, enum: ["checkout", "legacy_catalog", "unavailable"] },
                name: String,
                sku: String,
                packSize: String,
                image: String,
                variantId: { type: Schema.Types.ObjectId },
                variantName: { type: String, default: "" },
                variantSku: { type: String, default: "" },
                usesSharedStock: { type: Boolean, default: false },
                price: {
                    type: Number,
                    required: true,
                },
                originalPrice: {
                    type: Number,
                },
                discount: {
                    type: Number,
                    default: 0,
                },
                totalAmount: {
                    type: Number,
                    required: true,
                },
                status: {
                    type: String,
                    enum: ["active", "cancelled"],
                    default: "active",
                },
                cancellationReason: {
                    type: String,
                    default: "",
                },
                cancelledBy: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                },
            },
        ],
        originalGrandTotal: Number,
        grandTotal: {
            type: Number,
            required: true,
        },
        taxAmount: {
            type: Number,
            default: 0,
        },
        shippingFee: {
            type: Number,
            default: 0,
        },
        shippingMethod: {
            type: String,
            default: "standard",
        },
        refundDue: { type: Number, default: 0 },
        refunds: [{ amount: Number, reference: String, recordedBy: { type: Schema.Types.ObjectId, ref: "User" }, recordedAt: Date }],
        payment: {
            paidAmount: Number,
            recordedBy: Schema.Types.ObjectId,
            reference: String,
            paidAt: Date,
            method: {
                type: String,
                required: true,
            },
            ispaid: {
                type: Boolean,
                default: false,
            },
        },
        status: {
            type: String,
            enum: ["pending", "shipped", "delivered", "cancelled"],
            default: "pending",
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        isViewed: {
            type: Boolean,
            default: false,
        },
        cancellationReason: {
            type: String,
            default: "",
        },
        cancelledBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    },
);

orderSchema.index({ checkoutKey: 1 }, { unique: true, partialFilterExpression: { checkoutKey: { $type: "string" } } });
export default orderSchema;
