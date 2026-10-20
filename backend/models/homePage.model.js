import { Schema } from "mongoose";
import { safeContentTree } from "../utils/safeHtml.js";

const homePageSchema = new Schema(
    {
        teamHero: {
            enabled: { type: Boolean, default: true },
            image: { type: String, default: "" },
            imageFileId: { type: String, default: "" },
            mobileImage: { type: String, default: "" },
            mobileFileId: { type: String, default: "" },
            alt: { type: String, default: "The Zada Pharmacy team together", maxlength: 200 },
            eyebrow: { type: String, default: "Together, we are Zada", maxlength: 200 },
            heading: { type: String, default: "One team.\nOne commitment to care.", maxlength: 200 },
            description: { type: String, default: "Meet the people who bring care, dedication and a personal touch to Zada Pharmacy.", maxlength: 1000 },
            buttonText: { type: String, default: "Meet our people", maxlength: 200 },
            focusX: { type: Number, default: 50, min: 0, max: 100 },
            focusY: { type: Number, default: 50, min: 0, max: 100 },
            mobileFocusX: { type: Number, default: 50, min: 0, max: 100 },
            mobileFocusY: { type: Number, default: 50, min: 0, max: 100 },
        },
        sections: [
            {
                type: {
                    type: String,
                    required: true,
                    enum: [
                        "hero",
                        "top_micro_bar",
                        "announcement_bar",
                        "trust_badges",
                        "stats_counter",
                        "categories",
                        "ribbon",
                        "promo_banners",
                        "payment_strip",
                        "rx_upload_cta",
                        "products_grid",
                        "flash_sale",
                        "mid_banners",
                        "single_mid_banner",
                        "featured_category",
                        "conditions",
                        "testimonials",
                        "app_download",
                        "newsletter",
                        "blogs",
                        "brands",
                        "faq",
                        "custom_html",
                        "whatsapp_fab",
                        "spacer",
                        "footer",
                    ],
                },
                isVisible: { type: Boolean, default: true },
                order: { type: Number, default: 0 },
                // Flexible config — stores any section's settings as mixed
                config: { type: Schema.Types.Mixed, default: {}, set: safeContentTree },
            },
        ],
    },
    { timestamps: true }
);

export default homePageSchema;
