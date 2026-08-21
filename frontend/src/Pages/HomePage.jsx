import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    Heart,
    Sparkles,
    CreditCard,
    Smartphone,
    QrCode,
    Activity,
    HeartPulse,
    Pill,
    Stethoscope,
    Baby,
    Smile,
    ShieldCheck,
    ChevronDown,
    ArrowRight,
    Star,
    Truck,
    PhoneCall,
    CheckCircle,
    BookOpen,
    Zap,
    Tag,
    Droplets,
    Apple,
    Bandage,
    FlaskConical,
    Clock,
    Leaf,
    FileText,
    Upload,
    Timer,
    Mail,
    HelpCircle
} from "lucide-react";
import { useGetAllProducts } from "../api/hooks/product.api";
import { useGetActiveDeals } from "../api/hooks/promotion.api";
import { useGetHeroSlides } from "../api/hooks/hero.api.js";
import { useGetAllCategories } from "../api/hooks/category.api.js";
import ProductCard from "../Components/ProductCard";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../store/slices/cartSlice";
import { toggleWishlist } from "../store/slices/wishlistSlice";
import { useAddToWishlist, useRemoveFromWishlist } from "../api/hooks/user.api";
import { toast } from "react-toastify";
import { getImageUrl } from "../utils/imageHelper";
import { useGetHomePage } from "../api/hooks/homePage.api.js";

/* ─── Reusable Section Header ─────────────────────────────────────── */
const SectionHeader = ({ title, subtitle, cta, ctaPath }) => (
    <div className="flex items-end justify-between mb-7">
        <div>
            <div className="flex items-center gap-2 mb-1.5">
                <span className="block w-5 h-[2px] rounded-full bg-primary" />
                {/* Plus Jakarta Sans label — ultra-clear tracking for category labels */}
                <span className="font-sans text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">
                    {subtitle || "Curated For You"}
                </span>
            </div>
            {/* Plus Jakarta Sans h2 — geometric, bold, modern section titles */}
            <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                {title}
            </h2>
        </div>
        {cta && (
            <Link
                to={ctaPath || "/products"}
                className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary-dark uppercase tracking-[0.14em] transition-colors group"
            >
                {cta}
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
        )}
    </div>
);

/* ─── Mini Product Card for green ribbon ──────────────────────────── */
const RibbonProductCard = ({ prod, onWishlist, onCart, isWishlisted }) => {
    const rawP = Number(prod.price || 0);
    const effP =
        prod.effectivePrice !== undefined && prod.effectivePrice !== null
            ? Number(prod.effectivePrice)
            : (rawP || 40);
    const origP = rawP || 50;
    const hasDiscount = origP > effP;
    const discountPct = hasDiscount ? Math.round(((origP - effP) / origP) * 100) : 0;

    const getImageUrl = (img) => {
        if (!img) return null;
        if (img.startsWith("http://") || img.startsWith("https://")) return img;
        const endpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
        if (endpoint) {
            return `${endpoint.replace(/\/+$/, "")}/${img.replace(/^\/+/, "")}`;
        }
        return img;
    };

    const imageSrc = getImageUrl(prod.image);

    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-3.5 flex flex-col justify-between group hover:bg-white/20 hover:border-white/30 transition-all duration-200 relative h-full">
            <button
                type="button"
                onClick={(e) => onWishlist(e, prod)}
                aria-label="Wishlist"
                className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 cursor-pointer ${isWishlisted
                    ? "text-red-400 bg-red-400/20 shadow-xs"
                    : "text-white/50 hover:text-red-400 hover:bg-white/10"
                    }`}
            >
                <Heart size={12} fill={isWishlisted ? "currentColor" : "none"} />
            </button>

            <Link
                to={`/product/${prod._id || prod.id}`}
                className="w-full aspect-square flex items-center justify-center mb-2.5 overflow-hidden rounded-xl bg-white/10 p-2"
            >
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt={prod.name}
                        loading="lazy"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/200x200/1E5128/A6D76E?text=Rx";
                        }}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <Pill size={22} className="text-accent" />
                    </div>
                )}
            </Link>

            <div className="flex flex-col flex-1 justify-between">
                <div>
                    <div className="h-5 flex items-center mb-1">
                        {hasDiscount ? (
                            <span className="font-mono text-[9px] font-extrabold bg-red-500 text-white px-1.5 py-0.5 rounded-md tracking-wider">
                                -{discountPct}% OFF
                            </span>
                        ) : (
                            <span className="text-[9px] font-extrabold text-accent tracking-wider uppercase">
                                MediCare Pick
                            </span>
                        )}
                    </div>

                    <Link
                        to={`/product/${prod._id || prod.id}`}
                        title={prod.name}
                        className="text-sm sm:text-[13px] font-bold text-white/95 hover:text-white line-clamp-2 leading-snug mb-3.5 h-[38px] block transition-colors"
                    >
                        {prod.name}
                    </Link>
                </div>

                <div className="mt-auto">
                    <div className="h-[34px] flex flex-col justify-center mb-2.5">
                        <span className="font-mono text-sm font-bold text-white leading-none">
                            Rs. {effP.toLocaleString()}
                        </span>
                        {hasDiscount && (
                            <span className="font-mono text-[10px] text-white/50 line-through leading-none mt-0.5">
                                Rs. {origP.toLocaleString()}
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={(e) => onCart(e, prod)}
                        className="w-full h-8 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider rounded-xl bg-primary text-white hover:bg-primary-dark active:bg-primary-dark transition-colors cursor-pointer shadow-xs"
                    >
                        + Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── HomePage ────────────────────────────────────────────────────── */
const HomePage = ({ previewSections = null, activePreviewIdx = null }) => {
    const { getAllProducts } = useGetAllProducts();
    const { getActiveDeals } = useGetActiveDeals();
    const { getSlides, slides, loading: heroLoading } = useGetHeroSlides();
    const [products, setProducts] = useState([]);
    const [heroSlide, setHeroSlide] = useState(0);
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
            const sec = previewSections.find(s => s.type === type && (gridVariant ? s.gridVariant === gridVariant : true));
            return sec ? { ...fallback, ...sec.config } : fallback;
        }
        const key = type + (gridVariant ? `__${gridVariant}` : "");
        const found = pageConfig[key];
        return found ? { ...fallback, ...found.config } : fallback;
    };
    
    const isSectionVisible = (type, gridVariant = "") => {
        if (previewSections) {
            const sec = previewSections.find(s => s.type === type && (gridVariant ? s.gridVariant === gridVariant : true));
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
        if (previewSections) {
            setOrderedSections(previewSections);
            return;
        }
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
        getSlides().catch(() => { });
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

    // Icon name → Lucide component map (for builder-stored string icon names)
    const ICON_MAP = {
        Activity, HeartPulse, Pill, Stethoscope, Baby, Smile, Apple, Bandage, Leaf,
        ShieldCheck, Truck, PhoneCall, CheckCircle, Zap, Tag, Droplets, FlaskConical, Clock,
        Star, BookOpen,
    };
    const getIcon = (name, size = 22) => {
        const Comp = ICON_MAP[name];
        return Comp ? <Comp size={size} /> : <Pill size={size} />;
    };

    // Fallback static condition list (used if builder has no config)
    const fallbackConditionList = [
        { name: "Diabetes Care", icon: <Activity size={22} />, desc: "Insulin & Monitors", color: "bg-blue-50 text-blue-600 group-hover:bg-blue-500" },
        { name: "Heart & Blood Pressure", icon: <HeartPulse size={22} />, desc: "Cardio Support", color: "bg-red-50 text-red-500 group-hover:bg-red-500" },
        { name: "Digestive Health", icon: <Pill size={22} />, desc: "Probiotics & Antacids", color: "bg-amber-50 text-amber-600 group-hover:bg-amber-500" },
        { name: "Cold & Flu", icon: <Stethoscope size={22} />, desc: "Syrups & Lozenges", color: "bg-primary-pale text-primary group-hover:bg-primary" },
        { name: "Mother & Child", icon: <Baby size={22} />, desc: "Formula & Diapers", color: "bg-pink-50 text-pink-500 group-hover:bg-pink-500" },
        { name: "Skin & Hair", icon: <Smile size={22} />, desc: "Derma & Sunscreen", color: "bg-violet-50 text-violet-600 group-hover:bg-violet-500" },
    ];

    // Fallback static blog list
    const fallbackBlogsList = [
        { title: "Top 7 Essential Vitamins for Daily Immunity in Summer", readTime: "4 min read", category: "Nutrition", author: "Dr. Ayesha Malik", icon: "Apple", accentColor: "#F59E0B" },
        { title: "First Aid Kit Checklist: 10 Must-Have Medicines for Every Home", readTime: "5 min read", category: "Emergency Care", author: "Pharmacist Tariq", icon: "Bandage", accentColor: "#EF4444" },
        { title: "Seasonal Allergy Symptoms, Causes and Safe Treatment Options", readTime: "3 min read", category: "Wellness", author: "Dr. Hamza Khan", icon: "Leaf", accentColor: "#4d8d3a" },
    ];

    const brandsList = [
        { name: "GSK Healthcare", abbr: "GSK" },
        { name: "Abbott Laboratories", abbr: "ABT" },
        { name: "Bayer Pharma", abbr: "BAY" },
        { name: "Reckitt Benckiser", abbr: "RKT" },
        { name: "Pfizer Health", abbr: "PFZ" },
        { name: "Getz Pharma", abbr: "GTZ" },
        { name: "Sanofi Pasteur", abbr: "SNF" },
    ];

    const trustBadges = [
        { icon: <ShieldCheck size={20} />, title: "100% Genuine", desc: "Licensed pharmacy sourcing" },
        { icon: <Truck size={20} />, title: "2-Hour Delivery", desc: "Major cities covered" },
        { icon: <PhoneCall size={20} />, title: "24/7 Support", desc: "Expert pharmacist advice" },
        { icon: <CheckCircle size={20} />, title: "Easy Returns", desc: "7-day hassle-free policy" },
    ];

    // Auto-rotate hero
    useEffect(() => {
        if (!slides || slides.length === 0) return;
        const t = setInterval(() => setHeroSlide((p) => (p + 1) % slides.length), 5500);
        return () => clearInterval(t);
    }, [slides]);


    const renderSection = (section, idx) => {
        const { type, gridVariant } = section;
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
                return (
                    <div style={{ backgroundColor: cfg.bgColor, color: cfg.textColor }} className="marquee-container w-full py-2 text-xs sm:text-sm font-medium flex items-center overflow-hidden">
                        <div className="animate-marquee flex items-center gap-2 px-4 whitespace-nowrap">
                            <span>{cfg.text}</span>
                            {cfg.link && (
                                <Link to={cfg.link} className="underline font-bold hover:opacity-80 transition-opacity">
                                    {cfg.linkText}
                                </Link>
                            )}
                        </div>
                    </div>
                );
            })())}</div>;
            case "hero": return <div key={idx}>{wrap(<div className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] xl:h-[500px] overflow-hidden group bg-gray-100">
                {heroLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
                        <span className="text-gray-400 font-medium">Loading hero image...</span>
                    </div>
                ) : (!slides || slides.length === 0) ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                        <span className="text-gray-400 font-medium">No hero image available</span>
                    </div>
                ) : (
                    <>
                        {slides.map((slide, idx) => {
                            const isActive = idx === heroSlide;
                            const imageUrl = slide.image?.startsWith("http")
                                ? slide.image
                                : `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${slide.image}`;

                            return (
                                <div
                                    key={slide._id || idx}
                                    className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
                                >
                                    <img
                                        src={imageUrl}
                                        alt="Hero Banner"
                                        className="w-full h-full object-cover object-center"
                                    />
                                </div>
                            );
                        })}

                        {/* Navigation Arrows */}
                        {slides.length > 1 && (
                            <>
                                <button
                                    onClick={() => setHeroSlide((p) => (p - 1 + slides.length) % slides.length)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0"
                                >
                                    <ChevronLeft size={24} />
                                </button>

                                <button
                                    onClick={() => setHeroSlide((p) => (p + 1) % slides.length)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0"
                                >
                                    <ChevronRight size={24} />
                                </button>

                                {/* Navigation Dots */}
                                <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                                    {slides.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setHeroSlide(idx)}
                                            aria-label={`Go to slide ${idx + 1}`}
                                            className={`h-2 rounded-full transition-all duration-300 cursor-pointer shadow-sm ${heroSlide === idx
                                                ? "w-8 bg-primary"
                                                : "w-2 bg-white/60 hover:bg-white"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>)}</div>;
            case "trust_badges": return <div key={idx}>{wrap(<div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-4">
                    {(() => {
                        const cfg = getSectionConfig("trust_badges", { badges: trustBadges });
                        const badges = cfg.badges?.length
                            ? cfg.badges.map(b => ({ ...b, icon: trustBadges.find(t => t.icon?.type?.name === b.icon || t.title === b.title)?.icon || trustBadges[0].icon }))
                            : trustBadges;
                        return (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {badges.map((badge, i) => (
                                    <div key={i} className="bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
                                        <div className="w-9 h-9 rounded-xl bg-primary-pale text-primary flex items-center justify-center shrink-0">
                                            {badge.icon}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">{badge.title}</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">{badge.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>)}</div>;
            case "stats_counter": return <div key={idx}>{wrap(<div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-4">
                {(() => {
                    const cfg = getSectionConfig("stats_counter", { stats: [{ value: "50K+", label: "Happy Customers" }, { value: "2 hrs", label: "Avg. Delivery" }] });
                    return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            {(cfg.stats || []).slice(0, 4).map((s, i) => (
                                <div key={i} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                                    <h4 className="text-xl font-bold text-blue-600">{s.value}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>)}</div>;
            case "categories": return <div key={idx}>{wrap(<section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-12">
                    {(() => {
                        const cfg = getSectionConfig("categories", { title: "Browse Categories", subtitle: "Quick Access", ctaText: "All Products", ctaLink: "/products" });
                        return <SectionHeader title={cfg.title} subtitle={cfg.subtitle} cta={cfg.ctaText} ctaPath={cfg.ctaLink} />;
                    })()}

                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
                        {displayCategories.map((cat, idx) => {
                            const IconComp = cat.icon;
                            return (
                                <Link
                                    key={idx}
                                    to={cat.path}
                                    className="flex flex-col items-center group transition-all duration-200 text-center"
                                >
                                    {/* Image / Icon Container (fills full container) */}
                                    <div
                                        className={`w-full aspect-square rounded-2xl border overflow-hidden flex items-center justify-center transition-all duration-200 shadow-xs hover:shadow-md group-hover:scale-102 ${cat.border} ${cat.image ? "bg-white" : cat.bg
                                            }`}
                                    >
                                        {cat.image ? (
                                            <img
                                                src={getImageUrl(cat.image)}
                                                alt={cat.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <IconComp
                                                size={28}
                                                strokeWidth={1.75}
                                                className={`${cat.iconClass} group-hover:scale-110 transition-transform duration-200`}
                                            />
                                        )}
                                    </div>

                                    {/* Category Name outside the container */}
                                    <span
                                        className={`mt-2 font-sans text-xs sm:text-[13px] font-bold ${cat.label} group-hover:underline leading-tight text-center line-clamp-2`}
                                    >
                                        {cat.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </section>)}</div>;
            case "ribbon": return <div key={idx}>{wrap(<section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14 bg-gradient-to-r from-[#D5EAC3] to-[#ebf7d9] rounded-3xl p-6 sm:p-8">
                    {(() => {
                        const cfg = getSectionConfig("ribbon", { title: "Everyday Medicine & Wellness Must-Haves", subtitle: "Essential Picks" });
                        return (
                            <div className="rounded-2xl lg:rounded-3xl bg-gradient-to-br from-[#0D2309] via-primary-dark to-[#2A6835] overflow-hidden">
                                <div className="p-6 sm:p-8">
                                    <div className="flex items-end justify-between mb-6">
                                        <div>
                                            <p className="text-[11px] font-bold text-accent uppercase tracking-[0.15em] mb-1.5">{cfg.subtitle}</p>
                                            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{cfg.title}</h3>
                                        </div>
                                        <Link to="/products" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-accent hover:text-white uppercase tracking-wider transition-colors group">
                                            View All <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                        {displayProducts.slice(0, 6).map((prod) => (
                                            <RibbonProductCard key={prod._id || prod.id} prod={prod} onWishlist={handleWishlist} onCart={handleAddToCart}
                                                isWishlisted={!!wishlistItems.find((w) => matchId(w, prod))} />
                                        ))}
                                    </div>
                                    <div className="mt-5 sm:hidden text-center">
                                        <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wider">
                                            View All Products <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </section>)}</div>;
            case "promo_banners": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("promo_banners", {
                    banners: [
                        { badge: "Save up to 25%", badgeColor: "#4d8d3a", title: "Summer & Skin Care Essentials", desc: "Sunscreens, facial cleansers, hydration mists & body lotions from dermatologist-approved brands.", ctaText: "Shop Skincare", ctaLink: "/products?category=Personal", bgFrom: "#F0F9E6", bgTo: "#DCF0C4", borderColor: "#C8E2AC", ctaColor: "#1e4d28" },
                        { badge: "Daily Immunity", badgeColor: "#0EA5E9", title: "Vitamins & Supplements Boost", desc: "Vitamin C, Zinc, Omega-3, Calcium & Joint Supplements — fuel an active & healthy lifestyle.", ctaText: "Shop Vitamins", ctaLink: "/products?category=Nutrition", bgFrom: "#E8F4FB", bgTo: "#CCE8F7", borderColor: "#B0D8F0", ctaColor: "#0369A1" },
                    ]
                });
                return (
                    <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(cfg.banners || []).map((b, i) => (
                                <div key={i} className="relative rounded-2xl overflow-hidden p-6 sm:p-8 group hover:shadow-lg transition-all duration-300"
                                    style={{ background: `linear-gradient(to bottom right, ${b.bgFrom}, ${b.bgTo})`, border: `1px solid ${b.borderColor}` }}>
                                    <div className="absolute right-0 top-0 w-32 h-32 rounded-full -mr-8 -mt-8 blur-xl" style={{ background: `${b.badgeColor}20` }} />
                                    <div className="relative z-10">
                                        <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.15em] text-white px-2.5 py-1 rounded-full mb-3"
                                            style={{ background: b.badgeColor }}>
                                            {b.badge}
                                        </span>
                                        <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2 leading-tight">{b.title}</h3>
                                        <p className="text-xs text-gray-600 leading-relaxed mb-4 max-w-xs">{b.desc}</p>
                                        <Link to={b.ctaLink || "/products"} className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider group-hover:gap-2.5 transition-all"
                                            style={{ color: b.ctaColor }}>
                                            {b.ctaText} <ArrowRight size={13} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })())}</div>;
            case "payment_strip": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("payment_strip", {
                    title: "EXTRA 25% OFF with Bank Debit & Credit Cards",
                    subtitle: "Applies at checkout on all prescription & OTC orders. No minimum order required.",
                    ctaText: "View Offers",
                    ctaLink: "/promotions",
                });
                return (
                    <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-4">
                        <div className="rounded-xl bg-gradient-to-r from-[#1A2E0E] to-[#2C4E18] border border-[#1e4d28]/50 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-md shadow-primary/30">
                                    <CreditCard size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{cfg.title}</p>
                                    <p className="text-xs text-accent mt-0.5">{cfg.subtitle}</p>
                                </div>
                            </div>
                            <Link to={cfg.ctaLink || "/promotions"}
                                className="shrink-0 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm">
                                {cfg.ctaText || "View Offers"}
                            </Link>
                        </div>
                    </section>
                );
            })())}</div>;
            case "rx_upload_cta": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("rx_upload_cta", { title: "Upload Your Prescription", subtitle: "Get medicines delivered in 2 hours.", ctaText: "Upload Now", ctaLink: "/upload-prescription", bgColor: "#1e4d28" });
                return (
                    <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                        <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg relative overflow-hidden" style={{ backgroundColor: cfg.bgColor }}>
                            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            <div className="relative z-10 flex items-center gap-5 md:gap-6">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
                                    <FileText size={32} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5">{cfg.title}</h3>
                                    <p className="text-sm text-white/80 max-w-md">{cfg.subtitle}</p>
                                </div>
                            </div>
                            <div className="relative z-10 w-full md:w-auto shrink-0">
                                <Link to={cfg.ctaLink} className="flex items-center justify-center gap-2 w-full md:w-auto bg-white text-gray-900 px-6 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md hover:bg-gray-50 transition-colors">
                                    <Upload size={16} /> {cfg.ctaText}
                                </Link>
                            </div>
                        </div>
                    </section>
                );
            })())}</div>;
            case "flash_sale": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("flash_sale", { title: "Flash Sale", subtitle: "Limited Time Offers" });
                return (
                    <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                        <div className="flex items-end justify-between mb-7">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="block w-5 h-[2px] rounded-full bg-red-500" />
                                    <span className="font-sans text-[10px] font-extrabold uppercase tracking-[0.18em] text-red-500 flex items-center gap-1">
                                        <Timer size={12} /> {cfg.subtitle}
                                    </span>
                                </div>
                                <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">{cfg.title}</h2>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {displayProducts.slice(4, 10).map((prod) => (
                                <ProductCard key={prod._id || prod.id} product={prod} />
                            ))}
                        </div>
                    </section>
                );
            })())}</div>;
            case "products_grid": 
                if (gridVariant === "standard") return <div key={idx}>{wrap(<section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                    {(() => {
                        const cfg = getSectionConfig("products_grid", { title: "Top Selling Items", subtitle: "Best Sellers", ctaText: "View All", ctaLink: "/products" }, "standard");
                        return <SectionHeader title={cfg.title} subtitle={cfg.subtitle} cta={cfg.ctaText} ctaPath={cfg.ctaLink} />;
                    })()}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {displayProducts.slice(0, 6).map((prod) => (
                            <ProductCard key={prod._id || prod.id} product={prod} />
                        ))}
                    </div>
                </section>)}</div>;
                if (gridVariant === "deals") return <div key={idx}>{wrap(<section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                    {(() => {
                        const cfg = getSectionConfig("products_grid", { title: "Deals of the Day", subtitle: "Today's Offers", ctaText: "All Deals", ctaLink: "/promotions" }, "deals");
                        return <SectionHeader title={cfg.title} subtitle={cfg.subtitle} cta={cfg.ctaText} ctaPath={cfg.ctaLink} />;
                    })()}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {displayProducts.slice(2, 8).map((prod) => (
                            <ProductCard key={prod._id || prod.id} product={prod} />
                        ))}
                    </div>
                </section>)}</div>;
                return null;
            case "mid_banners": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("mid_banners", {
                    banners: [
                        { badge: "Infant Care", title: "Growing Strong:\nPremium Child Nutrition", desc: "Formulas, cereals, diapers, teething gels & infant wellness drops by trusted brands.", ctaText: "Shop Baby Care", ctaLink: "/products?category=Baby", bgFrom: "#1B3B5F", bgTo: "#2B5B8F", badgeColor: "#BAE6FD" },
                        { badge: "Pain & Fever", title: "Fast Relief from\nPain & Fever", desc: "Trusted pain relievers, fever syrups, effervescent tablets & analgesic balms.", ctaText: "Shop Pain Relief", ctaLink: "/products?category=Medicines", bgFrom: "#5B2A36", bgTo: "#8C3A4F", badgeColor: "#FECACA" },
                    ]
                });
                return (
                    <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(cfg.banners || []).map((b, i) => (
                                <div key={i} className="relative rounded-2xl text-white overflow-hidden p-6 sm:p-8 group hover:shadow-xl transition-all duration-300"
                                    style={{ background: `linear-gradient(to bottom right, ${b.bgFrom}, ${b.bgTo})` }}>
                                    <div className="absolute right-0 bottom-0 w-48 h-48 rounded-full bg-white/5 -mr-12 -mb-12 blur-2xl" />
                                    <div className="relative z-10">
                                        <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.12em] bg-white/10 border border-white/15 px-2.5 py-1 rounded-full mb-3"
                                            style={{ color: b.badgeColor }}>
                                            {b.badge}
                                        </span>
                                        <h3 className="text-xl sm:text-2xl font-extrabold mb-2 leading-tight">
                                            {(b.title || "").split("\n").map((line, li) => (
                                                <span key={li}>{line}{li < (b.title || "").split("\n").length - 1 && <br />}</span>
                                            ))}
                                        </h3>
                                        <p className="text-xs text-white/70 leading-relaxed mb-4 max-w-xs">{b.desc}</p>
                                        <Link to={b.ctaLink || "/products"} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white hover:text-white/70 uppercase tracking-wider group-hover:gap-2.5 transition-all">
                                            {b.ctaText} <ArrowRight size={13} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })())}</div>;
            case "app_download": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("app_download", {
                    title: "Download & Get\n10% Off Your First Order",
                    subtitle: "Upload prescriptions, track 2-hour deliveries in real time & set medication reminders — all in one app.",
                    appStoreBadge: "App Store",
                    playStoreBadge: "Google Play",
                    rating: "4.9",
                    reviewCount: "50K+",
                    appStoreLink: "#",
                    playStoreLink: "#",
                });
                const titleLines = (cfg.title || "").split("\n");
                return (
                    <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                        <div className="relative rounded-2xl lg:rounded-3xl bg-primary overflow-hidden">
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
                                <div className="absolute -left-10 -bottom-10 w-56 h-56 rounded-full bg-primary-dark/50 blur-xl" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8 sm:p-10 md:p-12">
                                <div className="text-center md:text-left space-y-3">
                                    <div className="inline-flex items-center gap-2 bg-primary-dark px-3.5 py-1.5 rounded-full">
                                        <Smartphone size={14} className="text-[#E0EED2]" />
                                        <span className="text-[11px] font-bold text-[#E0EED2] uppercase tracking-wider">MediCare Mobile App</span>
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                        {titleLines.map((line, i) => <span key={i}>{line}{i < titleLines.length - 1 && <br />}</span>)}
                                    </h3>
                                    <p className="text-sm text-white/80 max-w-md leading-relaxed">{cfg.subtitle}</p>
                                    <div className="flex flex-wrap gap-2.5 pt-1 justify-center md:justify-start">
                                        <a href={cfg.appStoreLink || "#"} className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-[11px] font-bold shadow-sm">
                                            <span className="text-lg">📱</span> {cfg.appStoreBadge || "App Store"}
                                        </a>
                                        <a href={cfg.playStoreLink || "#"} className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-[11px] font-bold shadow-sm">
                                            <span className="text-lg">▶</span> {cfg.playStoreBadge || "Google Play"}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 shrink-0">
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl p-2.5 flex items-center justify-center shadow-lg">
                                        <QrCode size={70} className="text-primary-dark" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[11px] font-bold text-white/80 mb-1">Scan to Download</p>
                                        <div className="flex items-center gap-1 text-white">
                                            {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="white" />)}
                                        </div>
                                        <p className="text-[11px] text-white/70 mt-0.5">{cfg.rating} · {cfg.reviewCount} Reviews</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                );
            })())}</div>;
            case "featured_category": return <div key={idx}>{wrap(<section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                    <SectionHeader title="Featured Products" subtitle="Editor's Picks" cta="View All" ctaPath="/products" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {displayProducts.slice(1, 7).map((prod) => (
                            <ProductCard key={prod._id || prod.id} product={prod} />
                        ))}
                    </div>
                </section>)}</div>;
            case "conditions": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("conditions", { title: "Care By Condition", subtitle: "Health Concerns", conditions: null });
                const conditionList = cfg.conditions?.length
                    ? cfg.conditions.map(c => ({ ...c, icon: getIcon(c.icon), color: "bg-primary-pale text-primary group-hover:bg-primary" }))
                    : fallbackConditionList;
                return (
                    <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                        <SectionHeader title={cfg.title} subtitle={cfg.subtitle} />
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            {conditionList.map((cond, idx) => (
                                <Link key={idx} to="/products"
                                    className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center group hover:border-primary/40 hover:shadow-lg transition-all duration-200 shadow-sm">
                                    <div className={`w-14 h-14 rounded-2xl ${cond.color} flex items-center justify-center mb-3.5 group-hover:scale-110 group-hover:text-white transition-all duration-200 shadow-sm`}>
                                        {cond.icon}
                                    </div>
                                    <h4 className="text-[11px] font-bold text-gray-900 group-hover:text-primary transition-colors leading-snug mb-1">{cond.name}</h4>
                                    <span className="text-[10px] text-gray-400 font-medium">{cond.desc}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                );
            })())}</div>;
            case "blogs": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("blogs", { title: "Health Advice & Blogs", subtitle: "Expert Insights", ctaText: "All Articles", ctaLink: "/about-us", blogs: null });
                const blogsList = cfg.blogs?.length ? cfg.blogs : fallbackBlogsList;
                return (
                    <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                        <SectionHeader title={cfg.title} subtitle={cfg.subtitle} cta={cfg.ctaText} ctaPath={cfg.ctaLink} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {blogsList.map((blog, idx) => {
                                const BlogIconComp = ICON_MAP[blog.icon];
                                const accentColor = blog.accentColor || "#4d8d3a";
                                return (
                                    <article key={idx}
                                        className="bg-white rounded-2xl border border-gray-100 flex flex-col shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200 group cursor-pointer overflow-hidden">
                                        <div className="h-1 w-full" style={{ background: accentColor }} />
                                        <div className="p-5 sm:p-6 flex flex-col flex-1">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-xl bg-primary-pale flex items-center justify-center shrink-0" style={{ background: `${accentColor}18` }}>
                                                        {BlogIconComp
                                                            ? <BlogIconComp size={17} strokeWidth={1.75} style={{ color: accentColor }} />
                                                            : <Leaf size={17} strokeWidth={1.75} style={{ color: accentColor }} />}
                                                    </div>
                                                    <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary bg-primary-pale px-2.5 py-1 rounded-full">{blog.category}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                    <BookOpen size={11} /> {blog.readTime}
                                                </span>
                                            </div>
                                            <h3 className="font-sans font-bold text-sm text-gray-900 group-hover:text-primary transition-colors leading-snug mb-auto">{blog.title}</h3>
                                            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                                                <span className="text-[11px] text-gray-500 font-medium">By {blog.author}</span>
                                                <span className="text-[11px] font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-200">
                                                    Read Article <ArrowRight size={11} />
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                );
            })())}</div>;
            case "brands": return <div key={idx}>{wrap(<section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                    {(() => {
                        const cfg = getSectionConfig("brands", { title: "Trusted Partner Brands", subtitle: "Our Manufacturers", ctaText: "Browse All", ctaLink: "/products", brands: brandsList });
                        const brands = cfg.brands?.length ? cfg.brands : brandsList;
                        return (
                            <>
                                <SectionHeader title={cfg.title} subtitle={cfg.subtitle} cta={cfg.ctaText} ctaPath={cfg.ctaLink} />
                                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-7 gap-3">
                                    {brands.map((brand, idx) => (
                                        <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex flex-col items-center justify-center text-center shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-200 group cursor-pointer">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-pale text-primary-dark flex items-center justify-center font-extrabold text-xs sm:text-sm mb-2 group-hover:bg-primary group-hover:text-white transition-colors">
                                                {brand.abbr}
                                            </div>
                                            <span className="text-[10px] font-semibold text-gray-600 leading-tight group-hover:text-primary transition-colors">
                                                {brand.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        );
                    })()}
                </section>)}</div>;
            case "testimonials": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("testimonials", { title: "What Our Customers Say", subtitle: "Reviews", testimonials: [{ name: "Ahmed R.", rating: 5, comment: "Amazing delivery speed and very helpful pharmacists.", city: "Karachi" }] });
                return (
                    <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14 bg-gray-100 rounded-3xl p-6 sm:p-10">
                        <SectionHeader title={cfg.title} subtitle={cfg.subtitle} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {(cfg.testimonials || []).map((t, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                                    <div className="flex items-center gap-1 mb-3 text-amber-400">
                                        {[...Array(5)].map((_, j) => <Star key={j} size={14} fill={j < t.rating ? "currentColor" : "none"} className={j < t.rating ? "" : "text-gray-300"} />)}
                                    </div>
                                    <p className="text-sm text-gray-700 italic flex-1 mb-4">"{t.comment}"</p>
                                    <div className="mt-auto">
                                        <p className="font-bold text-xs text-gray-900">{t.name}</p>
                                        <p className="text-[10px] text-gray-500">{t.city}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })())}</div>;
            case "newsletter": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("newsletter", { title: "Stay Informed", subtitle: "Subscribe for deals & tips.", placeholder: "Enter your email", ctaText: "Subscribe", bgColor: "#ebf7d9" });
                return (
                    <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                        <div className="rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center border border-gray-100 shadow-sm" style={{ backgroundColor: cfg.bgColor }}>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 text-primary shadow-sm">
                                <Mail size={24} />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{cfg.title}</h3>
                            <p className="text-sm text-gray-600 mb-6 max-w-md">{cfg.subtitle}</p>
                            <form className="w-full max-w-md flex items-center gap-2" onSubmit={e => e.preventDefault()}>
                                <input type="email" placeholder={cfg.placeholder} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                                <button type="submit" className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-colors shadow-sm">{cfg.ctaText}</button>
                            </form>
                        </div>
                    </section>
                );
            })())}</div>;
            case "faq": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("faq", { title: "Frequently Asked Questions", subtitle: "Got Questions?", faqs: [{ q: "How fast is delivery?", a: "We deliver within 2 hours in major cities." }] });
                return (
                    <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                        <SectionHeader title={cfg.title} subtitle={cfg.subtitle} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(cfg.faqs || []).map((faq, i) => (
                                <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <h4 className="font-bold text-sm text-gray-900 mb-2 flex items-start gap-2">
                                        <HelpCircle size={16} className="text-primary shrink-0 mt-0.5" />
                                        {faq.q}
                                    </h4>
                                    <p className="text-xs text-gray-600 pl-6 leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })())}</div>;
            case "custom_html": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("custom_html", { html: "" });
                if (!cfg.html) return null;
                return (
                    <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                        <div dangerouslySetInnerHTML={{ __html: cfg.html }} />
                    </section>
                );
            })())}</div>;
            case "spacer": return <div key={idx}>{wrap((() => {
                const cfg = getSectionConfig("spacer", { height: 40, showDivider: false, dividerColor: "#E5E7EB" });
                return (
                    <div style={{ height: `${cfg.height}px` }} className="w-full flex items-center justify-center">
                        {cfg.showDivider && <div className="w-full max-w-[1400px] mx-auto border-t" style={{ borderColor: cfg.dividerColor }} />}
                    </div>
                );
            })())}</div>;
            default: return null;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen text-gray-900 antialiased">
            {orderedSections.map((sec, idx) => renderSection(sec, idx))}

            {/* ── 15. SEO CONTENT ACCORDION ──────────────────────────── */}
            
            <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14 pb-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                    <h2 className="text-base sm:text-lg font-extrabold text-gray-900 mb-3">
                        MediCare — Pakistan's Trusted Online Pharmacy & Medical Store
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        MediCare is a licensed digital healthcare and pharmacy platform offering authentic prescription medicines, OTC remedies, vitamins, supplements, mother & baby care, and personal wellness products. With temperature-controlled express delivery across Karachi, Lahore, and Islamabad, we ensure you receive genuine healthcare essentials at your doorstep.
                    </p>

                    {seoExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                            <h4 className="font-bold text-gray-900 text-sm">Why Choose MediCare Online Pharmacy?</h4>
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