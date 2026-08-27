import { useEffect, useState, useMemo } from "react";

// ─── Reusable product filter ────────────────────────────────────────────────
// Filters & sorts the shared products pool according to the productSource
// value configured in the Page Builder (top_sellers | featured | on_sale | new_arrivals).
const filterProductsBySource = (products = [], source = "top_sellers", count = 6) => {
    if (!products.length) return [];
    let filtered;
    switch (source) {
        case "on_sale":
            filtered = products.filter(p => p.effectivePrice != null && p.effectivePrice < p.price);
            if (filtered.length < count) filtered = [...products]; // fallback if not enough sale items
            break;
        case "featured":
            filtered = products.filter(p => p.isFeatured);
            if (filtered.length < count) filtered = [...products]; // fallback
            break;
        case "new_arrivals":
            filtered = [...products].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            break;
        case "top_sellers":
        default:
            filtered = [...products].sort((a, b) => {
                const sa = a.soldCount ?? a.sold ?? 0;
                const sb = b.soldCount ?? b.sold ?? 0;
                return sb !== sa ? sb - sa : (b.price || 0) - (a.price || 0);
            });
            break;
    }
    return filtered.slice(0, count);
};
import { Link } from "react-router-dom";
import {
    Heart,
    ArrowRight,
    Zap,
    Tag,
    Baby,
    Droplets,
    Apple,
    FlaskConical,
    Bandage,
    ChevronDown,
} from "lucide-react";
import { useGetAllProducts } from "../api/hooks/product.api";
import { useGetActiveDeals } from "../api/hooks/promotion.api";
import { useGetAllCategories } from "../api/hooks/category.api.js";
import ProductCard from "../Components/ProductCard";
import AnnouncementBar from "../Components/HomeSections/AnnouncementBar";
import HeroSection from "../Components/HomeSections/HeroSection";
import TrustBadges from "../Components/HomeSections/TrustBadges";
import RibbonSection from "../Components/HomeSections/RibbonSection";
import PromoBanners from "../Components/HomeSections/PromoBanners";
import PaymentStrip from "../Components/HomeSections/PaymentStrip";
import RxUploadCta from "../Components/HomeSections/RxUploadCta";
import FlashSale from "../Components/HomeSections/FlashSale";
import ProductsGrid from "../Components/HomeSections/ProductsGrid";
import MidBanners from "../Components/HomeSections/MidBanners";
import SingleMidBanner from "../Components/HomeSections/SingleMidBanner";
import AppDownload from "../Components/HomeSections/AppDownload";
import ConditionsSection from "../Components/HomeSections/ConditionsSection";
import BlogsSection from "../Components/HomeSections/BlogsSection";
import BrandsSection from "../Components/HomeSections/BrandsSection";
import TestimonialsSection from "../Components/HomeSections/TestimonialsSection";
import NewsletterSection from "../Components/HomeSections/NewsletterSection";
import FaqSection from "../Components/HomeSections/FaqSection";
import CustomHtmlSection from "../Components/HomeSections/CustomHtmlSection";
import SpacerSection from "../Components/HomeSections/SpacerSection";
import WhatsappFab from "../Components/HomeSections/WhatsappFab";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../store/slices/cartSlice";
import { toggleWishlist } from "../store/slices/wishlistSlice";
import { useAddToWishlist, useRemoveFromWishlist } from "../api/hooks/user.api";
import { toast } from "react-toastify";
import { useGetHomePage } from "../api/hooks/homePage.api.js";

import SectionHeader from "../Components/HomeSections/SectionHeader";
import StatsCounter from "../Components/HomeSections/StatsCounter";
import CategoriesSection from "../Components/HomeSections/CategoriesSection";



/* ─── HomePage ────────────────────────────────────────────────────── */
const HomePage = ({ previewSections = null, activePreviewIdx = null }) => {
    const { getAllProducts } = useGetAllProducts();
    const { getActiveDeals } = useGetActiveDeals();
    const [products, setProducts] = useState([]);
    const [seoExpanded, setSeoExpanded] = useState(false);
    const { getAllCategories } = useGetAllCategories();
    const [dbCategories, setDbCategories] = useState([]);
    const { getHomePage } = useGetHomePage();
    const [pageConfig, setPageConfig] = useState({});
    const [orderedSections, setOrderedSections] = useState([]);

    const DEFAULT_LAYOUT = [
        { type: "announcement_bar" },
        { type: "hero" },
        { type: "trust_badges" },
        { type: "categories" },
        { type: "ribbon" },
        { type: "promo_banners" },
        { type: "payment_strip" },
        { type: "products_grid", gridVariant: "standard" },
        { type: "mid_banners" },
        { type: "products_grid", gridVariant: "deals" },
        { type: "app_download" },
        { type: "featured_category" },
        { type: "conditions" },
        { type: "blogs" },
        { type: "brands" }
    ];

    // Helper: get section config from builder, with optional fallback
    // gridVariant: for sections that appear multiple times (e.g. products_grid)
    const getSectionConfig = (type, fallback = {}, gridVariant = "") => {
        if (previewSections) {
            const sec = previewSections.find(s => s.type === type && (gridVariant ? (s.gridVariant === gridVariant || s.config?.gridVariant === gridVariant) : true));
            return sec ? { ...fallback, ...sec.config } : fallback;
        }
        const key = type + (gridVariant ? `__${gridVariant}` : "");
        const found = pageConfig[key];
        return found ? { ...fallback, ...found.config } : fallback;
    };

    const isSectionVisible = (type, gridVariant = "") => {
        if (previewSections) {
            const sec = previewSections.find(s => s.type === type && (gridVariant ? (s.gridVariant === gridVariant || s.config?.gridVariant === gridVariant) : true));
            return sec ? sec.isVisible : false;
        }
        const key = type + (gridVariant ? `__${gridVariant}` : "");
        const found = pageConfig[key];
        // If pageConfig is loaded and section is not found, default to true (new sections show by default)
        return found ? found.isVisible : true;
    };

    const dispatch = useDispatch();
    const wishlistItems = useSelector((state) => state.wishlist.items || []);
    const { addToWishlist } = useAddToWishlist();
    const { removeFromWishlist } = useRemoveFromWishlist();

    const matchId = (item, prod) => {
        if (!item || !prod) return false;
        return (item._id || item.id || item).toString() === (prod._id || prod.id || prod).toString();
    };

    const handleWishlist = async (e, prod) => {
        e.preventDefault();
        e.stopPropagation();
        const isIn = !!wishlistItems.find((w) => matchId(w, prod));
        dispatch(toggleWishlist(prod));
        try {
            const id = prod._id || prod.id;
            if (isIn) await removeFromWishlist(id);
            else await addToWishlist(id);
        } catch {
            dispatch(toggleWishlist(prod));
        }
    };

    const handleAddToCart = (e, prod) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(addToCart({ ...prod, quantity: 1 }));
        toast.success(`Added to cart!`);
    };

    useEffect(() => {
        if (!previewSections) {
            // Load homepage config from builder (with cache)
            getHomePage().then(res => {
                if (res?.sections && res.sections.length > 0) {
                    // Index by "type+gridVariant" to handle multiple products_grid sections
                    const indexed = {};
                    res.sections.forEach(s => {
                        const key = s.type + (s.config?.gridVariant ? `__${s.config.gridVariant}` : "");
                        indexed[key] = s;
                    });
                    setPageConfig(indexed);

                    const sorted = [...res.sections].sort((a, b) => a.order - b.order);
                    const orderedKeys = sorted.map(s => ({
                        type: s.type,
                        gridVariant: s.config?.gridVariant || ""
                    }));
                    setOrderedSections(orderedKeys);
                } else {
                    setOrderedSections(DEFAULT_LAYOUT);
                }
            }).catch(() => {
                setOrderedSections(DEFAULT_LAYOUT);
            });
        }

        // Fetch real data (products, categories, deals) regardless of preview mode
        (async () => {
            const response = await getAllProducts({ limit: 24 });
            if (response?.success && Array.isArray(response.products)) {
                setProducts(response.products);
            }
        })();
        (async () => {
            const res = await getAllCategories();
            if (res?.success) {
                const roots = res.categories.filter(c => !c.parentId && c.isActive);
                setDbCategories(roots.slice(0, 7));
            }
        })();
        getActiveDeals().catch(() => { });
    }, []);

    const fallbackProducts = useMemo(() => [
        { _id: "p-1", name: "Panadol Tablets 500mg (1 Strip = 10 Tablets)", price: 40, effectivePrice: 35, rating: 5 },
        { _id: "p-2", name: "Sensodyne Toothpaste Rapid Relief 75ml", price: 450, effectivePrice: 395, rating: 5 },
        { _id: "p-3", name: "CAC 1000 Plus Effervescent Tablets Orange (10s)", price: 320, effectivePrice: 285, rating: 5 },
        { _id: "p-4", name: "Surbex-Z High Potency Zinc & B-Complex (30s)", price: 580, effectivePrice: 510, rating: 5 },
        { _id: "p-5", name: "Disprin Direct Chewable 300mg (10s)", price: 60, effectivePrice: 52, rating: 5 },
        { _id: "p-6", name: "Dettol Antiseptic Liquid 250ml", price: 380, effectivePrice: 340, rating: 5 },
        { _id: "p-7", name: "Strepsils Honey & Lemon Lozenges (24s)", price: 260, effectivePrice: 230, rating: 5 },
        { _id: "p-8", name: "Voltral Emulgel Fast Pain Relief Gel 50g", price: 290, effectivePrice: 255, rating: 5 },
    ], []);

    const displayProducts = products.length > 0 ? products : fallbackProducts;



    const fallbackCategories = [
        {
            name: "New Arrivals",
            icon: Zap,
            bg: "bg-amber-50",
            iconClass: "text-amber-500",
            label: "text-amber-700",
            border: "border-amber-100 hover:border-amber-300",
            path: "/products",
        },
        {
            name: "Under Rs 499",
            icon: Tag,
            bg: "bg-rose-50",
            iconClass: "text-rose-500",
            label: "text-rose-700",
            border: "border-rose-100 hover:border-rose-300",
            path: "/products",
        },
        {
            name: "Mother & Baby",
            icon: Baby,
            bg: "bg-teal-50",
            iconClass: "text-teal-500",
            label: "text-teal-700",
            border: "border-teal-100 hover:border-teal-300",
            path: "/products?category=Baby",
        },
        {
            name: "Personal Care",
            icon: Droplets,
            bg: "bg-sky-50",
            iconClass: "text-sky-500",
            label: "text-sky-700",
            border: "border-sky-100 hover:border-sky-300",
            path: "/products?category=Personal",
        },
        {
            name: "Nutrition",
            icon: Apple,
            bg: "bg-primary-pale",
            iconClass: "text-primary-dark",
            label: "text-primary-dark",
            border: "border-primary-light hover:border-primary",
            path: "/products?category=Nutrition",
        },
        {
            name: "Medicines (Rx)",
            icon: FlaskConical,
            bg: "bg-[#F4F8EE]",
            iconClass: "text-primary",
            label: "text-primary-dark",
            border: "border-primary-light hover:border-primary",
            path: "/products?category=Medicines",
        },
        {
            name: "OTC & First Aid",
            icon: Bandage,
            bg: "bg-violet-50",
            iconClass: "text-violet-500",
            label: "text-violet-700",
            border: "border-violet-100 hover:border-violet-300",
            path: "/products?category=OTC",
        },
    ];

    const displayCategories = dbCategories.length > 0
        ? dbCategories.map((cat, index) => {
            const colors = [
                { bg: "bg-amber-50", text: "text-amber-500", border: "border-amber-100 hover:border-amber-300", label: "text-amber-700" },
                { bg: "bg-rose-50", text: "text-rose-500", border: "border-rose-100 hover:border-rose-300", label: "text-rose-700" },
                { bg: "bg-teal-50", text: "text-teal-500", border: "border-teal-100 hover:border-teal-300", label: "text-teal-700" },
                { bg: "bg-sky-50", text: "text-sky-500", border: "border-sky-100 hover:border-sky-300", label: "text-sky-700" },
                { bg: "bg-primary-pale", text: "text-primary", border: "border-primary-light hover:border-primary", label: "text-primary-dark" },
                { bg: "bg-violet-50", text: "text-violet-500", border: "border-violet-100 hover:border-violet-300", label: "text-violet-700" },
                { bg: "bg-pink-50", text: "text-pink-500", border: "border-pink-100 hover:border-pink-300", label: "text-pink-700" }
            ];
            const color = colors[index % colors.length];
            return {
                name: cat.name,
                image: cat.image,
                icon: Tag, // fallback icon
                bg: color.bg,
                iconClass: color.text,
                label: color.label,
                border: color.border,
                path: `/products?category=${encodeURIComponent(cat.name)}`
            };
        })
        : fallbackCategories;




    const renderSection = (section, idx) => {
        const { type } = section;
        const gridVariant = section.gridVariant || section.config?.gridVariant;
        if (!isSectionVisible(type, gridVariant)) return null;

        const isActive = activePreviewIdx === idx;
        const wrapperClass = isActive
            ? "ring-4 ring-blue-500 rounded-lg scale-[1.01] transition-all relative z-10 shadow-2xl overflow-hidden"
            : "";

        const wrap = (content) => (
            <div id={`preview-section-${idx}`} className={wrapperClass}>
                {content}
            </div>
        );

        switch (type) {
            case "announcement_bar": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("announcement_bar", {
                    text: "Free delivery on orders above Rs. 999!",
                    bgColor: "#1e4d28",
                    textColor: "#FFFFFF",
                    link: "/products",
                    linkText: "Shop Now"
                });
                return <AnnouncementBar config={cfg} />;
            })())}</div>;

            case "hero": return <div key={idx}>{wrap(
                <HeroSection />
            )}</div>;
            case "trust_badges": return <div key={idx}>{wrap(
                <TrustBadges config={getSectionConfig("trust_badges")} />
            )}</div>;
            case "stats_counter": return <div key={idx}>{wrap(
                <StatsCounter config={getSectionConfig("stats_counter", { stats: [{ value: "50K+", label: "Happy Customers" }, { value: "2 hrs", label: "Avg. Delivery" }] })} />
            )}</div>;
            case "categories": return <div key={idx}>{wrap(
                <CategoriesSection
                    config={getSectionConfig("categories", { title: "Browse Categories", subtitle: "Quick Access", ctaText: "All Products", ctaLink: "/products" })}
                    categories={displayCategories}
                />
            )}</div>;
            case "ribbon": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("ribbon", { title: "Everyday Medicine & Wellness Must-Haves", subtitle: "Essential Picks", productSource: "top_sellers", productCount: 6 });
                // If admin has hand-picked products, use those directly; otherwise fall back to source filter
                const manualPicks = cfg.selectedProducts;
                const ribbonProducts = (manualPicks && manualPicks.length > 0)
                    ? manualPicks
                    : filterProductsBySource(displayProducts, cfg.productSource, cfg.productCount || 6);
                return (
                    <RibbonSection
                        config={cfg}
                        products={ribbonProducts.length ? ribbonProducts : displayProducts.slice(0, cfg.productCount || 6)}
                    />
                );
            })())}</div>;
            case "promo_banners": return <div key={idx}>{wrap(
                <PromoBanners
                    config={getSectionConfig("promo_banners", {
                        banners: [
                            { badge: "Save up to 25%", badgeColor: "#4d8d3a", title: "Summer & Skin Care Essentials", desc: "Sunscreens, facial cleansers, hydration mists & body lotions from dermatologist-approved brands.", ctaText: "Shop Skincare", ctaLink: "/products?category=Personal", bgFrom: "#F0F9E6", bgTo: "#DCF0C4", borderColor: "#C8E2AC", ctaColor: "#1e4d28" },
                            { badge: "Daily Immunity", badgeColor: "#0EA5E9", title: "Vitamins & Supplements Boost", desc: "Vitamin C, Zinc, Omega-3, Calcium & Joint Supplements — fuel an active & healthy lifestyle.", ctaText: "Shop Vitamins", ctaLink: "/products?category=Nutrition", bgFrom: "#E8F4FB", bgTo: "#CCE8F7", borderColor: "#B0D8F0", ctaColor: "#0369A1" },
                        ]
                    })}
                />
            )}</div>;
            case "payment_strip": return <div key={idx}>{wrap(
                <PaymentStrip
                    config={getSectionConfig("payment_strip", {
                        title: "EXTRA 25% OFF with Bank Debit & Credit Cards",
                        subtitle: "Applies at checkout on all prescription & OTC orders. No minimum order required.",
                        ctaText: "View Offers",
                        ctaLink: "/promotions",
                    })}
                />
            )}</div>;
            case "rx_upload_cta": return <div key={idx}>{wrap(
                <RxUploadCta config={getSectionConfig("rx_upload_cta", { title: "Upload Your Prescription", subtitle: "Get medicines delivered in 2 hours.", ctaText: "Upload Now", ctaLink: "/upload-prescription", bgColor: "#1e4d28" })} />
            )}</div>;
            case "flash_sale": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("flash_sale", { title: "Flash Sale", subtitle: "Limited Time Offers", productSource: "on_sale", productCount: 6 });
                return (
                    <FlashSale
                        config={cfg}
                        products={filterProductsBySource(displayProducts, cfg.productSource, cfg.productCount || 6)}
                    />
                );
            })())}</div>;
            case "products_grid":
                if (gridVariant === "standard") return <div key={idx}>{wrap((() => {
                    const cfg = getSectionConfig("products_grid", { title: "Top Selling Items", subtitle: "Best Sellers", ctaText: "View All", ctaLink: "/products", productSource: "top_sellers", productCount: 6 }, "standard");
                    return (
                        <ProductsGrid
                            config={cfg}
                            products={filterProductsBySource(displayProducts, cfg.productSource, cfg.productCount || 6)}
                        />
                    );
                })())}</div>;
                if (gridVariant === "deals") return <div key={idx}>{wrap((() => {
                    const cfg = getSectionConfig("products_grid", { title: "Deals of the Day", subtitle: "Today's Offers", ctaText: "All Deals", ctaLink: "/promotions", productSource: "on_sale", productCount: 6 }, "deals");
                    return (
                        <ProductsGrid
                            config={cfg}
                            products={filterProductsBySource(displayProducts, cfg.productSource, cfg.productCount || 6)}
                        />
                    );
                })())}</div>;
                return null;
            case "mid_banners": return <div key={idx}>{wrap(
                <MidBanners
                    config={getSectionConfig("mid_banners", {
                        banners: [
                            { badge: "Infant Care", title: "Growing Strong:\nPremium Child Nutrition", desc: "Formulas, cereals, diapers, teething gels & infant wellness drops by trusted brands.", ctaText: "Shop Baby Care", ctaLink: "/products?category=Baby", bgFrom: "#1B3B5F", bgTo: "#2B5B8F", badgeColor: "#BAE6FD" },
                            { badge: "Pain & Fever", title: "Fast Relief from\nPain & Fever", desc: "Trusted pain relievers, fever syrups, effervescent tablets & analgesic balms.", ctaText: "Shop Pain Relief", ctaLink: "/products?category=Medicines", bgFrom: "#5B2A36", bgTo: "#8C3A4F", badgeColor: "#FECACA" },
                        ]
                    })}
                />
            )}</div>;
            case "single_mid_banner": return <div key={idx}>{wrap(
                <SingleMidBanner
                    config={getSectionConfig("single_mid_banner", {
                        badge: "Special Offer", title: "Full Width Banner", desc: "Great for big announcements.", ctaText: "Shop Now", ctaLink: "/products", bgFrom: "#1e4d28", bgTo: "#4d8d3a", badgeColor: "#dcfce7"
                    })}
                />
            )}</div>;
            case "app_download": return <div key={idx}>{wrap(
                <AppDownload
                    config={getSectionConfig("app_download", {
                        title: "Download & Get\n10% Off Your First Order",
                        subtitle: "Upload prescriptions, track 2-hour deliveries in real time & set medication reminders — all in one app.",
                        appStoreBadge: "App Store",
                        playStoreBadge: "Google Play",
                        rating: "4.9",
                        reviewCount: "50K+",
                        appStoreLink: "#",
                        playStoreLink: "#",
                    })}
                />
            )}</div>;
            case "featured_category": return <div key={idx}>{wrap(
                <ProductsGrid
                    config={getSectionConfig("featured_category", { title: "Featured Products", subtitle: "Editor's Picks", ctaText: "View All", ctaLink: "/products" })}
                    products={displayProducts}
                    sliceRange={[1, 7]}
                />
            )}</div>;
            case "conditions": return <div key={idx}>{wrap(
                <ConditionsSection
                    config={getSectionConfig("conditions", { title: "Care By Condition", subtitle: "Health Concerns" })}
                />
            )}</div>;
            case "blogs": return <div key={idx}>{wrap(
                <BlogsSection
                    config={getSectionConfig("blogs", { title: "Health Advice & Blogs", subtitle: "Expert Insights", ctaText: "All Articles", ctaLink: "/about-us" })}
                />
            )}</div>;
            case "brands": return <div key={idx}>{wrap(
                <BrandsSection
                    config={getSectionConfig("brands", { title: "Trusted Partner Brands", subtitle: "Our Manufacturers", ctaText: "Browse All", ctaLink: "/products" })}
                />
            )}</div>;
            case "testimonials": return <div key={idx}>{wrap(
                <TestimonialsSection config={getSectionConfig("testimonials", { title: "What Our Customers Say", subtitle: "Reviews" })} />
            )}</div>;
            case "newsletter": return <div key={idx}>{wrap(
                <NewsletterSection config={getSectionConfig("newsletter", { title: "Stay Informed", subtitle: "Subscribe for deals & tips.", placeholder: "Enter your email", ctaText: "Subscribe", bgColor: "#ebf7d9" })} />
            )}</div>;
            case "faq": return <div key={idx}>{wrap(
                <FaqSection config={getSectionConfig("faq", { title: "Frequently Asked Questions", subtitle: "Got Questions?" })} />
            )}</div>;
            case "custom_html": return <div key={idx}>{wrap(
                <CustomHtmlSection config={getSectionConfig("custom_html", { html: "" })} />
            )}</div>;
            case "whatsapp_fab": 
                // Only render inside HomePage if we are in the admin preview mode.
                // For the live site, it is globally rendered in BaseLayout.jsx instead!
                if (!previewSections) return null;
                return <div key={idx}>{wrap(
                    <WhatsappFab config={getSectionConfig("whatsapp_fab", { phoneNumber: "+923001234567", message: "Hello! I need help with my order.", position: "right" })} />
                )}</div>;
            case "spacer": return <div key={idx}>{wrap(
                <SpacerSection config={getSectionConfig("spacer", { height: 40, showDivider: false, dividerColor: "#E5E7EB" })} />
            )}</div>;
            default: return null;
        }
    };
    const sectionsToRender = previewSections || orderedSections;

    return (
        <div className="bg-gray-50 min-h-screen text-gray-900 antialiased">
            {sectionsToRender.map((sec, idx) => renderSection(sec, idx))}

            {/* ── 15. SEO CONTENT ACCORDION ──────────────────────────── */}

            <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14 pb-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                    <h2 className="text-base sm:text-lg font-extrabold text-gray-900 mb-3">
                        Zada — Pakistan's Trusted Online Pharmacy & Medical Store
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        Zada is a licensed digital healthcare and pharmacy platform offering authentic prescription medicines, OTC remedies, vitamins, supplements, mother & baby care, and personal wellness products. With temperature-controlled express delivery across Karachi, Lahore, and Islamabad, we ensure you receive genuine healthcare essentials at your doorstep.
                    </p>

                    {seoExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                            <h4 className="font-bold text-gray-900 text-sm">Why Choose Zada Online Pharmacy?</h4>
                            <p><strong className="text-gray-800">1. 100% Genuine Medicines:</strong> Directly sourced from licensed pharmaceutical manufacturers including GSK, Abbott, Bayer, and Getz Pharma.</p>
                            <p><strong className="text-gray-800">2. Express 2-Hour Delivery:</strong> Fast doorstep dispatch ensures you never run out of critical medications when you need them most.</p>
                            <p><strong className="text-gray-800">3. Certified Pharmacist Support:</strong> Upload your prescription online to get it verified and prepared by registered healthcare experts.</p>
                        </div>
                    )}

                    <button
                        onClick={() => setSeoExpanded(!seoExpanded)}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark transition-colors cursor-pointer"
                    >
                        {seoExpanded ? "Read Less" : "Read More"}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${seoExpanded ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </section>

        </div>
    );
};

export default HomePage;
