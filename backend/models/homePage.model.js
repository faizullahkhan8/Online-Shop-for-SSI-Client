import { Schema } from "mongoose";

const homePageSchema = new Schema(
    {
        sections: [
            {
                type: {
                    type: String,
                    required: true,
                    enum: [
                        "hero",
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
                        "featured_category",
                        "conditions",
                        "testimonials",
                        "app_download",
                        "newsletter",
                        "blogs",
                        "brands",
                        "faq",
                        "custom_html",
                        "spacer",
                    ],
                },
                isVisible: { type: Boolean, default: true },
                order: { type: Number, default: 0 },
                // Flexible config — stores any section's settings as mixed
                config: { type: Schema.Types.Mixed, default: {} },
            },
        ],
    },
    { timestamps: true }
);

export default homePageSchema;
