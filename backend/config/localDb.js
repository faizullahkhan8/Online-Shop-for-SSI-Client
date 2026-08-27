import mongoose from "mongoose";
import userSchema from "../models/user.model.js";
import productSchema from "../models/product.model.js";
import categorySchema from "../models/category.model.js";
import orderSchema from "../models/order.model.js";
import wishlistSchema from "../models/wishlist.model.js";
import settingsSchema from "../models/settings.model.js";
import promotionSchema from "../models/promotion.model.js";
import heroSchema from "../models/hero.model.js";
import reviewSchema from "../models/review.model.js";
import prescriptionSchema from "../models/prescription.model.js";
import menuSchema from "../models/menu.model.js";
import homePageSchema from "../models/homePage.model.js";
import vendorSchema from "../models/vendor.model.js";
import staffSchema from "../models/staff.model.js";
import smsTemplateSchema from "../models/smsTemplate.model.js";

let connectionPromise = null;
let localDbConnection = null;
let localUserModel;
let localProductModel;
let localCategoryModel;
let localOrderModel;
let localWishlistModel;
let localSettingsModel;
let localPromotionModel;
let localHeroModel;
let localReviewModel;
let localPrescriptionModel;
let localMenuModel;
let localHomePageModel;
let localVendorModel;
let localStaffModel;
let localSmsTemplateModel;

export const connectToDB = async () => {
    if (connectionPromise) return connectionPromise;

    connectionPromise = (async () => {
        try {
            // MONGO_URI_ONLINE
            // MONGO_URI_LOCAL

            localDbConnection = await mongoose
                .createConnection(process.env.MONGO_URI_ONLINE, {
                    dbName: "zada_pharmacy",
                })
                .asPromise();

            if (localDbConnection) {
                console.log(`Connected to MongoDB: ${localDbConnection.host}`);
            }

            localUserModel = localDbConnection.model("User", userSchema);
            localProductModel = localDbConnection.model(
                "Product",
                productSchema,
            );
            localCategoryModel = localDbConnection.model(
                "Category",
                categorySchema,
            );
            localOrderModel = localDbConnection.model("Order", orderSchema);
            localWishlistModel = localDbConnection.model(
                "Wishlist",
                wishlistSchema,
            );
            localSettingsModel = localDbConnection.model(
                "Settings",
                settingsSchema,
            );
            localPromotionModel = localDbConnection.model(
                "Promotion",
                promotionSchema,
            );
            localHeroModel = localDbConnection.model("Hero", heroSchema);
            localReviewModel = localDbConnection.model("Review", reviewSchema);
            localPrescriptionModel = localDbConnection.model("Prescription", prescriptionSchema);
            localMenuModel = localDbConnection.model("Menu", menuSchema);
            localHomePageModel = localDbConnection.model("HomePage", homePageSchema);
            localVendorModel = localDbConnection.model("Vendor", vendorSchema);
            localStaffModel = localDbConnection.model("Staff", staffSchema);
            localSmsTemplateModel = localDbConnection.model("SmsTemplate", smsTemplateSchema);

            return localDbConnection;
        } catch (error) {
            console.log("Database connection error:", error);
            connectionPromise = null; // Allow retry on next request
            throw error;
        }
    })();

    return connectionPromise;
};

export const getLocalUserModel = () => localUserModel || null;
export const getLocalProductModel = () => localProductModel || null;
export const getLocalCategoryModel = () => localCategoryModel || null;
export const getLocalOrderModel = () => localOrderModel || null;
export const getLocalWishlistModel = () => localWishlistModel || null;
export const getLocalSettingsModel = () => localSettingsModel || null;
export const getLocalPromotionModel = () => localPromotionModel || null;
export const getLocalHeroModel = () => localHeroModel || null;
export const getLocalReviewModel = () => localReviewModel || null;
export const getLocalPrescriptionModel = () => localPrescriptionModel || null;
export const getLocalMenuModel = () => localMenuModel || null;
export const getLocalHomePageModel = () => localHomePageModel || null;
export const getLocalVendorModel = () => localVendorModel || null;
export const getLocalStaffModel = () => localStaffModel || null;
export const getLocalSmsTemplateModel = () => localSmsTemplateModel || null;
