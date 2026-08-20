import { useEffect, useState, useMemo } from "react";
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

/* ─── Reusable Section Header ─────────────────────────────────────── */
const SectionHeader = ({ title, subtitle, cta, ctaPath }) => (
    <div className="flex items-end justify-between mb-7">
        <div>
            <div className="flex items-center gap-2 mb-1.5">
                <span className="block w-5 h-[2px] rounded-full bg-[#74AA34]" />
                {/* Plus Jakarta Sans label — ultra-clear tracking for category labels */}
                <span className="font-sans text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#74AA34]">
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
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#74AA34] hover:text-[#3E6913] uppercase tracking-[0.14em] transition-colors group"
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
                        <Pill size={22} className="text-[#A6D76E]" />
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
                            <span className="text-[9px] font-extrabold text-[#A6D76E] tracking-wider uppercase">
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
                        className="w-full h-8 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider rounded-xl bg-[#74AA34] text-white hover:bg-[#629329] active:bg-[#527E23] transition-colors cursor-pointer shadow-xs"
                    >
                        + Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── HomePage ────────────────────────────────────────────────────── */
const HomePage = () => {
    const { getAllProducts } = useGetAllProducts();
    const { getActiveDeals } = useGetActiveDeals();
    const { getSlides, slides, loading: heroLoading } = useGetHeroSlides();
    const [products, setProducts] = useState([]);
    const [heroSlide, setHeroSlide] = useState(0);
    const [seoExpanded, setSeoExpanded] = useState(false);
    const { getAllCategories } = useGetAllCategories();
    const [dbCategories, setDbCategories] = useState([]);

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
        (async () => {
            const response = await getAllProducts({ limit: 24 });
            if (response?.success && Array.isArray(response.products)) {
                setProducts(response.products);
            }
        })();
        (async () => {
            const res = await getAllCategories();
            if (res?.success) {
                // only take top level or whatever, or just take first 7
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
            bg: "bg-[#EDF6E5]",
            iconClass: "text-[#3E6913]",
            label: "text-[#3E6913]",
            border: "border-[#D5EAC3] hover:border-[#74AA34]",
            path: "/products?category=Nutrition",
        },
        {
            name: "Medicines (Rx)",
            icon: FlaskConical,
            bg: "bg-[#F4F8EE]",
            iconClass: "text-[#74AA34]",
            label: "text-[#3E6913]",
            border: "border-[#D5EAC3] hover:border-[#74AA34]",
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
                { bg: "bg-[#EDF6E5]", text: "text-[#74AA34]", border: "border-[#D5EAC3] hover:border-[#74AA34]", label: "text-[#3E6913]" },
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

    const conditionList = [
        { name: "Diabetes Care", icon: <Activity size={22} />, desc: "Insulin & Monitors", color: "bg-blue-50 text-blue-600 group-hover:bg-blue-500" },
        { name: "Heart & Blood Pressure", icon: <HeartPulse size={22} />, desc: "Cardio Support", color: "bg-red-50 text-red-500 group-hover:bg-red-500" },
        { name: "Digestive Health", icon: <Pill size={22} />, desc: "Probiotics & Antacids", color: "bg-amber-50 text-amber-600 group-hover:bg-amber-500" },
        { name: "Cold & Flu", icon: <Stethoscope size={22} />, desc: "Syrups & Lozenges", color: "bg-[#EDF6E5] text-[#74AA34] group-hover:bg-[#74AA34]" },
        { name: "Mother & Child", icon: <Baby size={22} />, desc: "Formula & Diapers", color: "bg-pink-50 text-pink-500 group-hover:bg-pink-500" },
        { name: "Skin & Hair", icon: <Smile size={22} />, desc: "Derma & Sunscreen", color: "bg-violet-50 text-violet-600 group-hover:bg-violet-500" },
    ];

    const blogsList = [
        {
            title: "Top 7 Essential Vitamins for Daily Immunity in Summer",
            readTime: "4 min read",
            category: "Nutrition",
            author: "Dr. Ayesha Malik",
            icon: Apple,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-500",
            accentBar: "bg-amber-400",
        },
        {
            title: "First Aid Kit Checklist: 10 Must-Have Medicines for Every Home",
            readTime: "5 min read",
            category: "Emergency Care",
            author: "Pharmacist Tariq",
            icon: Bandage,
            iconBg: "bg-rose-50",
            iconColor: "text-rose-500",
            accentBar: "bg-rose-400",
        },
        {
            title: "Seasonal Allergy Symptoms, Causes and Safe Treatment Options",
            readTime: "3 min read",
            category: "Wellness",
            author: "Dr. Hamza Khan",
            icon: Leaf,
            iconBg: "bg-[#EDF6E5]",
            iconColor: "text-[#74AA34]",
            accentBar: "bg-[#74AA34]",
        },
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

    return (
        <div className="bg-gray-50 min-h-screen text-gray-900 antialiased">

            {/* ── 1. HERO BANNER (Full Width Image Carousel) ──────────── */}
            <div className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] xl:h-[500px] overflow-hidden group bg-gray-100">
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
                                                    ? "w-8 bg-[#74AA34]"
                                                    : "w-2 bg-white/60 hover:bg-white"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* ── 2. TRUST BADGES ────────────────────────────────────── */}
            <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {trustBadges.map((badge, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 shadow-sm hover:border-[#74AA34]/30 hover:shadow-md transition-all duration-200">
                            <div className="w-9 h-9 rounded-xl bg-[#EDF6E5] text-[#74AA34] flex items-center justify-center shrink-0">
                                {badge.icon}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-900">{badge.title}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">{badge.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── 3. CATEGORIES ──────────────────────────────────────── */}
            <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-12">
                <SectionHeader title="Browse Categories" subtitle="Quick Access" cta="All Products" ctaPath="/products" />

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
                                    className={`w-full aspect-square rounded-2xl border overflow-hidden flex items-center justify-center transition-all duration-200 shadow-xs hover:shadow-md group-hover:scale-102 ${cat.border} ${
                                        cat.image ? "bg-white" : cat.bg
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
            </section>

            {/* ── 4. DEEP GREEN RIBBON ───────────────────────────────── */}
            <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-12">
                <div className="rounded-2xl lg:rounded-3xl bg-gradient-to-br from-[#0D2309] via-[#1E5128] to-[#2A6835] overflow-hidden">
                    <div className="p-6 sm:p-8">
                        {/* Header */}
                        <div className="flex items-end justify-between mb-6">
                            <div>
                                <p className="text-[11px] font-bold text-[#A6D76E] uppercase tracking-[0.15em] mb-1.5">
                                    Essential Picks
                                </p>
                                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                                    Everyday Medicine & Wellness Must-Haves
                                </h3>
                            </div>
                            <Link
                                to="/products"
                                className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#A6D76E] hover:text-white uppercase tracking-wider transition-colors group"
                            >
                                View All
                                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>

                        {/* Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {displayProducts.slice(0, 6).map((prod) => (
                                <RibbonProductCard
                                    key={prod._id || prod.id}
                                    prod={prod}
                                    onWishlist={handleWishlist}
                                    onCart={handleAddToCart}
                                    isWishlisted={!!wishlistItems.find((w) => matchId(w, prod))}
                                />
                            ))}
                        </div>

                        <div className="mt-5 sm:hidden text-center">
                            <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A6D76E] uppercase tracking-wider">
                                View All Products <ArrowRight size={12} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 5. DUAL PROMO BANNERS ──────────────────────────────── */}
            <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Summer Care */}
                    <div className="relative rounded-2xl bg-gradient-to-br from-[#F0F9E6] to-[#DCF0C4] border border-[#C8E2AC] overflow-hidden p-6 sm:p-8 group hover:shadow-lg transition-all duration-300">
                        <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-[#74AA34]/8 -mr-8 -mt-8 blur-xl" />
                        <div className="relative z-10">
                            <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.15em] text-white bg-[#74AA34] px-2.5 py-1 rounded-full mb-3">
                                Save up to 25%
                            </span>
                            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2 leading-tight">
                                Summer & Skin Care Essentials
                            </h3>
                            <p className="text-xs text-gray-600 leading-relaxed mb-4 max-w-xs">
                                Sunscreens, facial cleansers, hydration mists & body lotions from dermatologist-approved brands.
                            </p>
                            <Link to="/products?category=Personal" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#3E6913] hover:text-[#74AA34] uppercase tracking-wider group-hover:gap-2.5 transition-all">
                                Shop Skincare <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>

                    {/* Vitamins */}
                    <div className="relative rounded-2xl bg-gradient-to-br from-[#E8F4FB] to-[#CCE8F7] border border-[#B0D8F0] overflow-hidden p-6 sm:p-8 group hover:shadow-lg transition-all duration-300">
                        <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-sky-400/10 -mr-8 -mt-8 blur-xl" />
                        <div className="relative z-10">
                            <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.15em] text-white bg-sky-500 px-2.5 py-1 rounded-full mb-3">
                                Daily Immunity
                            </span>
                            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2 leading-tight">
                                Vitamins & Supplements Boost
                            </h3>
                            <p className="text-xs text-gray-600 leading-relaxed mb-4 max-w-xs">
                                Vitamin C, Zinc, Omega-3, Calcium & Joint Supplements — fuel an active & healthy lifestyle.
                            </p>
                            <Link to="/products?category=Nutrition" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sky-700 hover:text-sky-500 uppercase tracking-wider group-hover:gap-2.5 transition-all">
                                Shop Vitamins <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 6. PAYMENT DISCOUNT STRIP ──────────────────────────── */}
            <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-4">
                <div className="rounded-xl bg-gradient-to-r from-[#1A2E0E] to-[#2C4E18] border border-[#3E6913]/50 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#74AA34] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#74AA34]/30">
                            <CreditCard size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">
                                EXTRA 25% OFF with Bank Debit & Credit Cards
                            </p>
                            <p className="text-xs text-[#A6D76E] mt-0.5">
                                Applies at checkout on all prescription & OTC orders. No minimum order required.
                            </p>
                        </div>
                    </div>
                    <Link to="/promotions"
                        className="shrink-0 px-4 py-2 bg-[#74AA34] hover:bg-[#629329] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm">
                        View Offers
                    </Link>
                </div>
            </section>

            {/* ── 7. TOP SELLING ITEMS ───────────────────────────────── */}
            <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                <SectionHeader title="Top Selling Items" subtitle="Best Sellers" cta="View All" ctaPath="/products" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {displayProducts.slice(0, 6).map((prod) => (
                        <ProductCard key={prod._id || prod.id} product={prod} />
                    ))}
                </div>
            </section>

            {/* ── 8. MID-PAGE DUAL BANNERS ───────────────────────────── */}
            <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Infant Care */}
                    <div className="relative rounded-2xl bg-gradient-to-br from-[#1B3B5F] to-[#2B5B8F] text-white overflow-hidden p-6 sm:p-8 group hover:shadow-xl transition-all duration-300">
                        <div className="absolute right-0 bottom-0 w-48 h-48 rounded-full bg-white/5 -mr-12 -mb-12 blur-2xl" />
                        <div className="relative z-10">
                            <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.12em] text-sky-200 bg-white/10 border border-white/15 px-2.5 py-1 rounded-full mb-3">
                                Infant Care
                            </span>
                            <h3 className="text-xl sm:text-2xl font-extrabold mb-2 leading-tight">
                                Growing Strong:<br />Premium Child Nutrition
                            </h3>
                            <p className="text-xs text-blue-200 leading-relaxed mb-4 max-w-xs">
                                Formulas, cereals, diapers, teething gels & infant wellness drops by trusted brands.
                            </p>
                            <Link to="/products?category=Baby" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white hover:text-sky-200 uppercase tracking-wider group-hover:gap-2.5 transition-all">
                                Shop Baby Care <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>

                    {/* Pain & Fever */}
                    <div className="relative rounded-2xl bg-gradient-to-br from-[#5B2A36] to-[#8C3A4F] text-white overflow-hidden p-6 sm:p-8 group hover:shadow-xl transition-all duration-300">
                        <div className="absolute right-0 bottom-0 w-48 h-48 rounded-full bg-white/5 -mr-12 -mb-12 blur-2xl" />
                        <div className="relative z-10">
                            <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.12em] text-red-200 bg-white/10 border border-white/15 px-2.5 py-1 rounded-full mb-3">
                                Pain & Fever
                            </span>
                            <h3 className="text-xl sm:text-2xl font-extrabold mb-2 leading-tight">
                                Fast Relief from<br />Pain & Fever
                            </h3>
                            <p className="text-xs text-red-200 leading-relaxed mb-4 max-w-xs">
                                Trusted pain relievers, fever syrups, effervescent tablets & analgesic balms.
                            </p>
                            <Link to="/products?category=Medicines" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white hover:text-red-200 uppercase tracking-wider group-hover:gap-2.5 transition-all">
                                Shop Pain Relief <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 9. DEALS SECTION ───────────────────────────────────── */}
            <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                <SectionHeader title="Deals of the Day" subtitle="Today's Offers" cta="All Deals" ctaPath="/promotions" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {displayProducts.slice(2, 8).map((prod) => (
                        <ProductCard key={prod._id || prod.id} product={prod} />
                    ))}
                </div>
            </section>

            {/* ── 10. APP DOWNLOAD BANNER ────────────────────────────── */}
            <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                <div className="relative rounded-2xl lg:rounded-3xl bg-[#74AA34] overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute -left-10 -bottom-10 w-56 h-56 rounded-full bg-[#629329]/50 blur-xl" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8 sm:p-10 md:p-12">
                        <div className="text-center md:text-left space-y-3">
                            <div className="inline-flex items-center gap-2 bg-[#629329] px-3.5 py-1.5 rounded-full">
                                <Smartphone size={14} className="text-[#E0EED2]" />
                                <span className="text-[11px] font-bold text-[#E0EED2] uppercase tracking-wider">
                                    MediCare Mobile App
                                </span>
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Download & Get<br />10% Off Your First Order
                            </h3>
                            <p className="text-sm text-white/80 max-w-md leading-relaxed">
                                Upload prescriptions, track 2-hour deliveries in real time & set medication reminders — all in one app.
                            </p>
                            <div className="flex flex-wrap gap-2.5 pt-1 justify-center md:justify-start">
                                <div className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-[11px] font-bold shadow-sm">
                                    <span className="text-lg">📱</span> App Store
                                </div>
                                <div className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-[11px] font-bold shadow-sm">
                                    <span className="text-lg">▶</span> Google Play
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 shrink-0">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl p-2.5 flex items-center justify-center shadow-lg">
                                <QrCode size={70} className="text-[#1E5128]" />
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] font-bold text-white/80 mb-1">Scan to Download</p>
                                <div className="flex items-center gap-1 text-white">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="white" />)}
                                </div>
                                <p className="text-[11px] text-white/70 mt-0.5">4.9 · 50K+ Reviews</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 11. FEATURED PRODUCTS ──────────────────────────────── */}
            <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                <SectionHeader title="Featured Products" subtitle="Editor's Picks" cta="View All" ctaPath="/products" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {displayProducts.slice(1, 7).map((prod) => (
                        <ProductCard key={prod._id || prod.id} product={prod} />
                    ))}
                </div>
            </section>

            {/* ── 12. CARE BY CONDITION ──────────────────────────────── */}
            <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                <SectionHeader title="Care By Condition" subtitle="Health Concerns" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {conditionList.map((cond, idx) => (
                        <Link
                            key={idx}
                            to="/products"
                            className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center group hover:border-[#74AA34]/40 hover:shadow-lg transition-all duration-200 shadow-sm"
                        >
                            <div className={`w-13 h-13 w-14 h-14 rounded-2xl ${cond.color} flex items-center justify-center mb-3.5 group-hover:scale-110 group-hover:text-white transition-all duration-200 shadow-sm`}>
                                {cond.icon}
                            </div>
                            <h4 className="text-[11px] font-bold text-gray-900 group-hover:text-[#74AA34] transition-colors leading-snug mb-1">
                                {cond.name}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-medium">
                                {cond.desc}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── 13. HEALTH BLOGS ───────────────────────────────────── */}
            <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                <SectionHeader title="Health Advice & Blogs" subtitle="Expert Insights" cta="All Articles" ctaPath="/about-us" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {blogsList.map((blog, idx) => {
                        const BlogIcon = blog.icon;
                        return (
                            <article
                                key={idx}
                                className="bg-white rounded-2xl border border-gray-100 flex flex-col shadow-sm hover:shadow-lg hover:border-[#74AA34]/30 transition-all duration-200 group cursor-pointer overflow-hidden"
                            >
                                {/* Top color accent bar */}
                                <div className={`h-1 w-full ${blog.accentBar}`} />

                                <div className="p-5 sm:p-6 flex flex-col flex-1">
                                    {/* Icon + Category */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2.5">
                                            {/* Lucide icon in themed bubble */}
                                            <div className={`w-9 h-9 rounded-xl ${blog.iconBg} flex items-center justify-center shrink-0`}>
                                                <BlogIcon size={17} strokeWidth={1.75} className={blog.iconColor} />
                                            </div>
                                            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#74AA34] bg-[#EDF6E5] px-2.5 py-1 rounded-full">
                                                {blog.category}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                            <BookOpen size={11} /> {blog.readTime}
                                        </span>
                                    </div>

                                    <h3 className="font-sans font-bold text-sm text-gray-900 group-hover:text-[#74AA34] transition-colors leading-snug mb-auto">
                                        {blog.title}
                                    </h3>

                                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-[11px] text-gray-500 font-medium">By {blog.author}</span>
                                        <span className="text-[11px] font-bold text-[#74AA34] flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-200">
                                            Read Article <ArrowRight size={11} />
                                        </span>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* ── 14. PARTNER BRANDS ─────────────────────────────────── */}
            <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
                <SectionHeader title="Trusted Partner Brands" subtitle="Our Manufacturers" cta="Browse All" ctaPath="/products" />
                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-7 gap-3">
                    {brandsList.map((brand, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex flex-col items-center justify-center text-center shadow-sm hover:border-[#74AA34]/40 hover:shadow-md transition-all duration-200 group cursor-pointer"
                        >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#EDF6E5] text-[#3E6913] flex items-center justify-center font-extrabold text-xs sm:text-sm mb-2 group-hover:bg-[#74AA34] group-hover:text-white transition-colors">
                                {brand.abbr}
                            </div>
                            <span className="text-[10px] font-semibold text-gray-600 leading-tight group-hover:text-[#74AA34] transition-colors">
                                {brand.name}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

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
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#74AA34] hover:text-[#3E6913] transition-colors cursor-pointer"
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
