import { useEffect, useState, useMemo, useCallback } from "react";
import { Tag } from "lucide-react";
import { useGetAllProducts } from "../api/hooks/product.api";
import { useGetAllCategories } from "../api/hooks/category.api.js";
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
import { useDispatch } from "react-redux";
import { addToCart } from "../store/slices/cartSlice";
import { useGetWishlist, useAddToWishlist, useRemoveFromWishlist } from "../api/hooks/user.api";
import { toast } from "react-toastify";
import { useGetHomePage } from "../api/hooks/homePage.api.js";

import StatsCounter from "../Components/HomeSections/StatsCounter";
import CategoriesSection from "../Components/HomeSections/CategoriesSection";

/* ─── Reusable product filter ──────────────────────────────────────── */
const filterProductsBySource = (products = [], source = "top_sellers", count = 6) => {
    if (!products.length) return [];
    let filtered;
    switch (source) {
        case "on_sale":
            filtered = products.filter(p => p.effectivePrice != null && p.effectivePrice < p.price);
            if (filtered.length < count) filtered = [...products];
            break;
        case "featured":
            filtered = products.filter(p => p.isFeatured);
            if (filtered.length < count) filtered = [...products];
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

/* ─── HomePage ────────────────────────────────────────────────────── */
const HomePage = ({ previewSections = null, activePreviewIdx = null }) => {
    const {
        data: allProductsData,
        loading: productsLoading,
    } = useGetAllProducts({ limit: 24 });
    const products = useMemo(() => allProductsData?.products || [], [allProductsData]);
    const { data: categoriesData } = useGetAllCategories();
    const { data: homePageData, loading: homePageLoading } = useGetHomePage();
    const [pageConfig, setPageConfig] = useState({});
    const [orderedSections, setOrderedSections] = useState([]);

    const getSectionConfig = useCallback((type, fallback = {}, gridVariant = "") => {
        if (previewSections) {
            const sec = previewSections.find(s => s.type === type && (gridVariant ? (s.gridVariant === gridVariant || s.config?.gridVariant === gridVariant) : true));
            return sec ? { ...fallback, ...sec.config } : fallback;
        }
        const key = type + (gridVariant ? `__${gridVariant}` : "");
        const found = pageConfig[key];
        return found ? { ...fallback, ...found.config } : fallback;
    }, [previewSections, pageConfig]);

    const isSectionVisible = useCallback((type, gridVariant = "") => {
        if (previewSections) {
            const sec = previewSections.find(s => s.type === type && (gridVariant ? (s.gridVariant === gridVariant || s.config?.gridVariant === gridVariant) : true));
            return sec ? sec.isVisible : false;
        }
        const key = type + (gridVariant ? `__${gridVariant}` : "");
        const found = pageConfig[key];
        return found ? found.isVisible : true;
    }, [previewSections, pageConfig]);

    const dispatch = useDispatch();
    const { data } = useGetWishlist();
    const wishlistItems = data?.wishlist || [];
    const { addToWishlist } = useAddToWishlist();
    const { removeFromWishlist } = useRemoveFromWishlist();

    const handleWishlist = useCallback(async (e, prod) => {
        e.preventDefault();
        e.stopPropagation();
        const isIn = !!wishlistItems.find((w) => (w._id || w.id || w).toString() === (prod._id || prod.id || prod).toString());
        try {
            const id = prod._id || prod.id;
            if (isIn) await removeFromWishlist(id);
            else await addToWishlist(id);
        } catch {
            // Error handled by mutation
        }
    }, [wishlistItems, addToWishlist, removeFromWishlist]);

    const handleAddToCart = useCallback((e, prod) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(addToCart({ ...prod, quantity: 1 }));
        toast.success(`Added to cart!`);
    }, [dispatch]);

    useEffect(() => {
        if (!previewSections && !homePageLoading) {
            if (homePageData?.sections && homePageData.sections.length > 0) {
                const indexed = {};
                homePageData.sections.forEach(s => {
                    const key = s.type + (s.config?.gridVariant ? `__${s.config.gridVariant}` : "");
                    indexed[key] = s;
                });
                setPageConfig(indexed);

                const sorted = [...homePageData.sections].sort((a, b) => a.order - b.order);
                const orderedKeys = sorted.map(s => ({
                    type: s.type,
                    gridVariant: s.config?.gridVariant || ""
                }));
                setOrderedSections(orderedKeys);
            } else {
                setPageConfig({});
                setOrderedSections([]);
            }
        }
    }, [homePageData, previewSections, homePageLoading]);

    useEffect(() => {
        if (categoriesData?.success) {
            const roots = categoriesData.categories.filter(c => !c.parentId && c.isActive);
            setDbCategories(roots.slice(0, 7));
        }
    }, [categoriesData]);

    const [dbCategories, setDbCategories] = useState([]);

    const displayCategories = useMemo(() => {
        if (dbCategories.length > 0) {
            const colors = [
                { bg: "bg-amber-50", text: "text-amber-500", border: "border-amber-100 hover:border-amber-300", label: "text-amber-700" },
                { bg: "bg-rose-50", text: "text-rose-500", border: "border-rose-100 hover:border-rose-300", label: "text-rose-700" },
                { bg: "bg-teal-50", text: "text-teal-500", border: "border-teal-100 hover:border-teal-300", label: "text-teal-700" },
                { bg: "bg-sky-50", text: "text-sky-500", border: "border-sky-100 hover:border-sky-300", label: "text-sky-700" },
                { bg: "bg-primary-pale", text: "text-primary", border: "border-primary-light hover:border-primary", label: "text-primary-dark" },
                { bg: "bg-violet-50", text: "text-violet-500", border: "border-violet-100 hover:border-violet-300", label: "text-violet-700" },
                { bg: "bg-pink-50", text: "text-pink-500", border: "border-pink-100 hover:border-pink-300", label: "text-pink-700" }
            ];
            return dbCategories.map((cat, index) => ({
                name: cat.name,
                image: cat.image,
                icon: Tag,
                bg: colors[index % colors.length].bg,
                iconClass: colors[index % colors.length].text,
                label: colors[index % colors.length].label,
                border: colors[index % colors.length].border,
                path: `/products?category=${encodeURIComponent(cat.name)}`
            }));
        }
        return [];
    }, [dbCategories]);

    const displayProducts = products;

    const sectionsToRender = previewSections || orderedSections;

    return (
        <div className="bg-gray-50 min-h-screen text-gray-900 antialiased">
            {sectionsToRender.map((sec, idx) => {
                const { type } = sec;
                const gridVariant = sec.gridVariant || sec.config?.gridVariant;
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
                    case "announcement_bar": {
                        const cfg = getSectionConfig("announcement_bar");
                        return <div key={idx}>{wrap(<AnnouncementBar config={cfg} />)}</div>;
                    }
                    case "hero": return <div key={idx}>{wrap(<HeroSection />)}</div>;
                    case "trust_badges": return <div key={idx}>{wrap(<TrustBadges config={getSectionConfig("trust_badges")} />)}</div>;
                    case "stats_counter": return <div key={idx}>{wrap(<StatsCounter config={getSectionConfig("stats_counter")} />)}</div>;
                    case "categories": return <div key={idx}>{wrap(<CategoriesSection config={getSectionConfig("categories")} categories={displayCategories} />)}</div>;
                    case "ribbon": {
                        const cfg = getSectionConfig("ribbon");
                        const manualPicks = cfg.selectedProducts;
                        const ribbonProducts = (manualPicks && manualPicks.length > 0) ? manualPicks : filterProductsBySource(displayProducts, cfg.productSource, cfg.productCount || 6);
                        return <div key={idx}>{wrap(<RibbonSection config={cfg} products={ribbonProducts.length ? ribbonProducts : displayProducts.slice(0, cfg.productCount || 6)} />)}</div>;
                    }
                    case "promo_banners": return <div key={idx}>{wrap(<PromoBanners config={getSectionConfig("promo_banners")} />)}</div>;
                    case "payment_strip": return <div key={idx}>{wrap(<PaymentStrip config={getSectionConfig("payment_strip")} />)}</div>;
                    case "rx_upload_cta": return <div key={idx}>{wrap(<RxUploadCta config={getSectionConfig("rx_upload_cta")} />)}</div>;
                    case "flash_sale": {
                        const cfg = getSectionConfig("flash_sale");
                        return <div key={idx}>{wrap(<FlashSale config={cfg} products={filterProductsBySource(displayProducts, cfg.productSource, cfg.productCount || 6)} />)}</div>;
                    }
                    case "products_grid":
                        if (gridVariant === "standard") {
                            const cfg = getSectionConfig("products_grid", {}, "standard");
                            return <div key={idx}>{wrap(<ProductsGrid config={cfg} products={filterProductsBySource(displayProducts, cfg.productSource, cfg.productCount || 6)} loading={productsLoading} />)}</div>;
                        }
                        if (gridVariant === "deals") {
                            const cfg = getSectionConfig("products_grid", {}, "deals");
                            return <div key={idx}>{wrap(<ProductsGrid config={cfg} products={filterProductsBySource(displayProducts, cfg.productSource, cfg.productCount || 6)} loading={productsLoading} />)}</div>;
                        }
                        return null;
                    case "mid_banners": return <div key={idx}>{wrap(<MidBanners config={getSectionConfig("mid_banners")} />)}</div>;
                    case "single_mid_banner": return <div key={idx}>{wrap(<SingleMidBanner config={getSectionConfig("single_mid_banner")} />)}</div>;
                    case "app_download": return <div key={idx}>{wrap(<AppDownload config={getSectionConfig("app_download")} />)}</div>;
                    case "featured_category": return <div key={idx}>{wrap(<ProductsGrid config={getSectionConfig("featured_category")} products={displayProducts} sliceRange={[1, 7]} loading={productsLoading} />)}</div>;
                    case "conditions": return <div key={idx}>{wrap(<ConditionsSection config={getSectionConfig("conditions")} />)}</div>;
                    case "blogs": return <div key={idx}>{wrap(<BlogsSection config={getSectionConfig("blogs")} />)}</div>;
                    case "brands": return <div key={idx}>{wrap(<BrandsSection config={getSectionConfig("brands")} />)}</div>;
                    case "testimonials": return <div key={idx}>{wrap(<TestimonialsSection config={getSectionConfig("testimonials")} />)}</div>;
                    case "newsletter": return <div key={idx}>{wrap(<NewsletterSection config={getSectionConfig("newsletter")} />)}</div>;
                    case "faq": return <div key={idx}>{wrap(<FaqSection config={getSectionConfig("faq")} />)}</div>;
                    case "custom_html": return <div key={idx}>{wrap(<CustomHtmlSection config={getSectionConfig("custom_html")} />)}</div>;
                    case "whatsapp_fab":
                        if (!previewSections) return null;
                        return <div key={idx}>{wrap(<WhatsappFab config={getSectionConfig("whatsapp_fab")} />)}</div>;
                    case "spacer": return <div key={idx}>{wrap(<SpacerSection config={getSectionConfig("spacer")} />)}</div>;
                    default: return null;
                }
            })}

        </div>
    );
};

export default HomePage;
