import expressAsyncHandler from "express-async-handler";
import { getLocalHomePageModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";

// Default config for all 22 section types
const DEFAULT_SECTIONS = [
    {
        type: "announcement_bar",
        isVisible: false,
        order: 0,
        config: {
            text: "🎉 Free delivery on orders above Rs. 999! Use code: FREESHIP",
            bgColor: "#1E5128",
            textColor: "#FFFFFF",
            link: "/products",
            linkText: "Shop Now",
        },
    },
    {
        type: "hero",
        isVisible: true,
        order: 1,
        config: {},
    },
    {
        type: "trust_badges",
        isVisible: true,
        order: 2,
        config: {
            badges: [
                { icon: "ShieldCheck", title: "100% Genuine", desc: "Licensed pharmacy sourcing" },
                { icon: "Truck", title: "2-Hour Delivery", desc: "Major cities covered" },
                { icon: "PhoneCall", title: "24/7 Support", desc: "Expert pharmacist advice" },
                { icon: "CheckCircle", title: "Easy Returns", desc: "7-day hassle-free policy" },
            ],
        },
    },
    {
        type: "stats_counter",
        isVisible: false,
        order: 3,
        config: {
            stats: [
                { value: "50K+", label: "Happy Customers", icon: "Users" },
                { value: "2 hrs", label: "Avg. Delivery Time", icon: "Clock" },
                { value: "10K+", label: "Products Available", icon: "Package" },
                { value: "4.9★", label: "Customer Rating", icon: "Star" },
            ],
        },
    },
    {
        type: "categories",
        isVisible: true,
        order: 4,
        config: {
            title: "Browse Categories",
            subtitle: "Quick Access",
            ctaText: "All Products",
            ctaLink: "/products",
        },
    },
    {
        type: "ribbon",
        isVisible: true,
        order: 5,
        config: {
            title: "Everyday Medicine & Wellness Must-Haves",
            subtitle: "Essential Picks",
            ctaText: "View All",
            ctaLink: "/products",
            productSource: "top_sellers",
            productCount: 6,
        },
    },
    {
        type: "promo_banners",
        isVisible: true,
        order: 6,
        config: {
            banners: [
                {
                    badge: "Save up to 25%",
                    badgeColor: "#74AA34",
                    title: "Summer & Skin Care Essentials",
                    desc: "Sunscreens, facial cleansers, hydration mists & body lotions from dermatologist-approved brands.",
                    ctaText: "Shop Skincare",
                    ctaLink: "/products?category=Personal",
                    bgFrom: "#F0F9E6",
                    bgTo: "#DCF0C4",
                    borderColor: "#C8E2AC",
                    ctaColor: "#3E6913",
                },
                {
                    badge: "Daily Immunity",
                    badgeColor: "#0EA5E9",
                    title: "Vitamins & Supplements Boost",
                    desc: "Vitamin C, Zinc, Omega-3, Calcium & Joint Supplements — fuel an active & healthy lifestyle.",
                    ctaText: "Shop Vitamins",
                    ctaLink: "/products?category=Nutrition",
                    bgFrom: "#E8F4FB",
                    bgTo: "#CCE8F7",
                    borderColor: "#B0D8F0",
                    ctaColor: "#0369A1",
                },
            ],
        },
    },
    {
        type: "payment_strip",
        isVisible: true,
        order: 7,
        config: {
            title: "EXTRA 25% OFF with Bank Debit & Credit Cards",
            subtitle: "Applies at checkout on all prescription & OTC orders. No minimum order required.",
            ctaText: "View Offers",
            ctaLink: "/promotions",
        },
    },
    {
        type: "rx_upload_cta",
        isVisible: false,
        order: 8,
        config: {
            title: "Upload Your Prescription",
            subtitle: "Get medicines delivered in 2 hours — verified by licensed pharmacists.",
            ctaText: "Upload Now",
            ctaLink: "/upload-prescription",
            bgColor: "#1E5128",
        },
    },
    {
        type: "flash_sale",
        isVisible: false,
        order: 9,
        config: {
            title: "Flash Sale",
            subtitle: "Limited Time Offers",
            endTime: null,
            productSource: "on_sale",
            productCount: 6,
        },
    },
    {
        type: "products_grid",
        isVisible: true,
        order: 10,
        config: {
            title: "Top Selling Items",
            subtitle: "Best Sellers",
            ctaText: "View All",
            ctaLink: "/products",
            productSource: "top_sellers",
            productCount: 6,
            gridVariant: "standard",
        },
    },
    {
        type: "mid_banners",
        isVisible: true,
        order: 11,
        config: {
            banners: [
                {
                    badge: "Infant Care",
                    title: "Growing Strong:\nPremium Child Nutrition",
                    desc: "Formulas, cereals, diapers, teething gels & infant wellness drops by trusted brands.",
                    ctaText: "Shop Baby Care",
                    ctaLink: "/products?category=Baby",
                    bgFrom: "#1B3B5F",
                    bgTo: "#2B5B8F",
                    badgeColor: "#BAE6FD",
                },
                {
                    badge: "Pain & Fever",
                    title: "Fast Relief from\nPain & Fever",
                    desc: "Trusted pain relievers, fever syrups, effervescent tablets & analgesic balms.",
                    ctaText: "Shop Pain Relief",
                    ctaLink: "/products?category=Medicines",
                    bgFrom: "#5B2A36",
                    bgTo: "#8C3A4F",
                    badgeColor: "#FECACA",
                },
            ],
        },
    },
    {
        type: "products_grid",
        isVisible: true,
        order: 12,
        config: {
            title: "Deals of the Day",
            subtitle: "Today's Offers",
            ctaText: "All Deals",
            ctaLink: "/promotions",
            productSource: "on_sale",
            productCount: 6,
            gridVariant: "deals",
        },
    },
    {
        type: "featured_category",
        isVisible: false,
        order: 13,
        config: {
            badge: "Featured",
            title: "Diabetic Care Collection",
            desc: "Insulin, glucometers, test strips & diabetic-friendly supplements — all in one place.",
            ctaText: "Shop Now",
            ctaLink: "/products?category=Diabetes",
            bgColor: "#1E3A5F",
            image: "",
        },
    },
    {
        type: "conditions",
        isVisible: true,
        order: 14,
        config: {
            title: "Care By Condition",
            subtitle: "Health Concerns",
            conditions: [
                { name: "Diabetes Care", desc: "Insulin & Monitors", icon: "Activity" },
                { name: "Heart & Blood Pressure", desc: "Cardio Support", icon: "HeartPulse" },
                { name: "Digestive Health", desc: "Probiotics & Antacids", icon: "Pill" },
                { name: "Cold & Flu", desc: "Syrups & Lozenges", icon: "Stethoscope" },
                { name: "Mother & Child", desc: "Formula & Diapers", icon: "Baby" },
                { name: "Skin & Hair", desc: "Derma & Sunscreen", icon: "Smile" },
            ],
        },
    },
    {
        type: "testimonials",
        isVisible: false,
        order: 15,
        config: {
            title: "What Our Customers Say",
            subtitle: "Customer Reviews",
            testimonials: [
                { name: "Ayesha M.", rating: 5, comment: "Super fast delivery! Got my medicines in under 2 hours. Highly recommend.", city: "Karachi" },
                { name: "Tariq A.", rating: 5, comment: "Genuine products and excellent pharmacist support. Best online pharmacy!", city: "Lahore" },
                { name: "Fatima Z.", rating: 5, comment: "Easy prescription upload. The team verified and dispatched within 30 minutes.", city: "Islamabad" },
            ],
        },
    },
    {
        type: "app_download",
        isVisible: true,
        order: 16,
        config: {
            title: "Download & Get\n10% Off Your First Order",
            subtitle: "Upload prescriptions, track 2-hour deliveries in real time & set medication reminders — all in one app.",
            appStoreBadge: "App Store",
            playStoreBadge: "Google Play",
            rating: "4.9",
            reviewCount: "50K+",
            appStoreLink: "#",
            playStoreLink: "#",
        },
    },
    {
        type: "newsletter",
        isVisible: false,
        order: 17,
        config: {
            title: "Stay Healthy, Stay Informed",
            subtitle: "Subscribe for health tips, exclusive deals & medicine reminders.",
            placeholder: "Enter your email address",
            ctaText: "Subscribe",
            bgColor: "#EDF6E5",
            privacyText: "We never spam. Unsubscribe anytime.",
        },
    },
    {
        type: "blogs",
        isVisible: true,
        order: 18,
        config: {
            title: "Health Advice & Blogs",
            subtitle: "Expert Insights",
            ctaText: "All Articles",
            ctaLink: "/about-us",
            blogs: [
                {
                    title: "Top 7 Essential Vitamins for Daily Immunity in Summer",
                    readTime: "4 min read",
                    category: "Nutrition",
                    author: "Dr. Ayesha Malik",
                    icon: "Apple",
                    accentColor: "#F59E0B",
                },
                {
                    title: "First Aid Kit Checklist: 10 Must-Have Medicines for Every Home",
                    readTime: "5 min read",
                    category: "Emergency Care",
                    author: "Pharmacist Tariq",
                    icon: "Bandage",
                    accentColor: "#EF4444",
                },
                {
                    title: "Seasonal Allergy Symptoms, Causes and Safe Treatment Options",
                    readTime: "3 min read",
                    category: "Wellness",
                    author: "Dr. Hamza Khan",
                    icon: "Leaf",
                    accentColor: "#74AA34",
                },
            ],
        },
    },
    {
        type: "brands",
        isVisible: true,
        order: 19,
        config: {
            title: "Trusted Partner Brands",
            subtitle: "Our Manufacturers",
            ctaText: "Browse All",
            ctaLink: "/products",
            brands: [
                { name: "GSK Healthcare", abbr: "GSK" },
                { name: "Abbott Laboratories", abbr: "ABT" },
                { name: "Bayer Pharma", abbr: "BAY" },
                { name: "Reckitt Benckiser", abbr: "RKT" },
                { name: "Pfizer Health", abbr: "PFZ" },
                { name: "Getz Pharma", abbr: "GTZ" },
                { name: "Sanofi Pasteur", abbr: "SNF" },
            ],
        },
    },
    {
        type: "faq",
        isVisible: false,
        order: 20,
        config: {
            title: "Frequently Asked Questions",
            subtitle: "Got Questions?",
            faqs: [
                { q: "Do you deliver prescription medicines?", a: "Yes! Upload your prescription and our licensed pharmacists will verify and dispatch within 2 hours." },
                { q: "Are all products 100% genuine?", a: "Absolutely. We source directly from licensed pharmaceutical manufacturers and distributors." },
                { q: "What is your return policy?", a: "We offer a 7-day hassle-free return policy on all non-prescription products." },
                { q: "How fast is delivery?", a: "2-hour express delivery is available in Karachi, Lahore, and Islamabad." },
            ],
        },
    },
    {
        type: "custom_html",
        isVisible: false,
        order: 21,
        config: {
            html: "<!-- Add your custom HTML or embed code here -->",
            label: "Custom Block",
        },
    },
    {
        type: "spacer",
        isVisible: false,
        order: 22,
        config: {
            height: 40,
            showDivider: false,
            dividerColor: "#E5E7EB",
        },
    },
];

// @desc    Get homepage config
// @route   GET /api/homepage
// @access  Public
export const getHomePage = expressAsyncHandler(async (req, res, next) => {
    const HomePageModel = getLocalHomePageModel();
    if (!HomePageModel) return next(new ErrorResponse("HomePage model not found", 500));

    let doc = await HomePageModel.findOne({});

    // If no config exists yet, return the default config (don't save it yet)
    if (!doc) {
        return res.status(200).json({
            success: true,
            sections: DEFAULT_SECTIONS,
            isDefault: true,
        });
    }

    res.status(200).json({
        success: true,
        sections: doc.sections,
        isDefault: false,
    });
});

// @desc    Update homepage config (full replace)
// @route   PUT /api/homepage
// @access  Private/Admin
export const updateHomePage = expressAsyncHandler(async (req, res, next) => {
    const HomePageModel = getLocalHomePageModel();
    if (!HomePageModel) return next(new ErrorResponse("HomePage model not found", 500));

    const { sections } = req.body;

    if (!sections || !Array.isArray(sections)) {
        return next(new ErrorResponse("sections array is required", 400));
    }

    // Upsert — create if not exists, update if exists
    const doc = await HomePageModel.findOneAndUpdate(
        {},
        { sections },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
        success: true,
        sections: doc.sections,
    });
});

// @desc    Reset homepage to defaults
// @route   DELETE /api/homepage
// @access  Private/Admin
export const resetHomePage = expressAsyncHandler(async (req, res, next) => {
    const HomePageModel = getLocalHomePageModel();
    if (!HomePageModel) return next(new ErrorResponse("HomePage model not found", 500));

    await HomePageModel.deleteMany({});

    res.status(200).json({
        success: true,
        sections: DEFAULT_SECTIONS,
        message: "HomePage reset to defaults",
    });
});
