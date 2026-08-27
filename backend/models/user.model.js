import { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
        },
        password: {
            type: String,
            required: true,
        },
        isPhoneVerified: {
            type: Boolean,
            default: false,
        },
        phoneVerificationOtp: {
            type: String,
        },
        phoneVerificationExpires: {
            type: Date,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        avatar: {
            type: String,
            default: "",
        },
        avatarFileId: {
            type: String,
            default: "",
        },
        addresses: [
            {
                street: { type: String, default: "" },
                addressLine2: { type: String, default: "" },
                city: { type: String, default: "" },
                state: { type: String, default: "" },
                postalCode: { type: String, default: "" },
                country: { type: String, default: "" },
                lat: { type: Number },
                lng: { type: Number },
            },
        ],
        cart: [
            {
                product: { type: Schema.Types.ObjectId, ref: "Product" },
                quantity: { type: Number, default: 1 },
            },
        ],
        // single wishlist document per user
        wishlist: {
            type: Schema.Types.ObjectId,
            ref: "Wishlist",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw new Error(error);
    }
});

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export default userSchema;
