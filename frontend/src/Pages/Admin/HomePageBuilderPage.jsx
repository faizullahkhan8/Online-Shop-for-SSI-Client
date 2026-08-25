import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import HeroManager from "../../Components/Admin/HeroManager";
import {
    Eye, EyeOff, GripVertical, Save, RotateCcw, Plus, X, ChevronDown, ChevronUp,
    Shield, Truck, Phone, CheckCircle, Users, Clock, Package, Star, Zap,
    LayoutTemplate, Settings2, Trash2, Copy, ToggleLeft, ToggleRight,
    ArrowUp, ArrowDown, Loader2, ExternalLink
} from "lucide-react";
import { useGetHomePage, useUpdateHomePage, useResetHomePage, useUploadHomePageImage } from "../../api/hooks/homePage.api.js";
import { useGetAllVendors } from "../../api/hooks/vendor.api.js";
import { useNavigate } from "react-router-dom";
import HomePage from "../HomePage";
import ProductSelector from "../../Components/Admin/ProductSelector";

/* ─── Section Type Meta ────────────────────────────────────────────────── */
const SECTION_META = {
    hero: { label: "Hero Banner", icon: "🖼️", color: "bg-purple-100 text-purple-700", category: "Banner" },
    announcement_bar: { label: "Announcement Bar", icon: "📢", color: "bg-yellow-100 text-yellow-700", category: "Banner" },
    trust_badges: { label: "Trust Badges", icon: "🏅", color: "bg-blue-100 text-blue-700", category: "Content" },
    stats_counter: { label: "Stats Counter", icon: "📊", color: "bg-indigo-100 text-indigo-700", category: "Content" },
    categories: { label: "Categories Grid", icon: "📂", color: "bg-teal-100 text-teal-700", category: "Content" },
    ribbon: { label: "Green Ribbon", icon: "🎗️", color: "bg-green-100 text-green-700", category: "Content" },
    promo_banners: { label: "Promo Banners", icon: "🎨", color: "bg-pink-100 text-pink-700", category: "Banner" },
    payment_strip: { label: "Payment Strip", icon: "💳", color: "bg-emerald-100 text-emerald-700", category: "Banner" },
    rx_upload_cta: { label: "Prescription Upload CTA", icon: "💊", color: "bg-red-100 text-red-700", category: "Banner" },
    flash_sale: { label: "Flash Sale Countdown", icon: "⏰", color: "bg-orange-100 text-orange-700", category: "Content" },
    products_grid: { label: "Products Grid", icon: "🛍️", color: "bg-violet-100 text-violet-700", category: "Content" },
    mid_banners: { label: "Mid Banners (Double)", icon: "🌟", color: "bg-cyan-100 text-cyan-700", category: "Banner" },
    single_mid_banner: { label: "Single Mid Banner", icon: "🌠", color: "bg-indigo-100 text-indigo-700", category: "Banner" },
    featured_category: { label: "Featured Category", icon: "🗂️", color: "bg-rose-100 text-rose-700", category: "Banner" },
    conditions: { label: "Care by Condition", icon: "🏥", color: "bg-blue-100 text-blue-700", category: "Content" },
    testimonials: { label: "Testimonials", icon: "⭐", color: "bg-amber-100 text-amber-700", category: "Content" },
    top_micro_bar: { label: "Top Micro Bar (Header)", icon: "☎️", color: "bg-teal-100 text-teal-700", category: "Banner" },
    app_download: { label: "App Download", icon: "📱", color: "bg-green-100 text-green-700", category: "Banner" },
    newsletter: { label: "Newsletter Signup", icon: "📧", color: "bg-sky-100 text-sky-700", category: "Content" },
    blogs: { label: "Health Blogs", icon: "📝", color: "bg-lime-100 text-lime-700", category: "Content" },
    brands: { label: "Partner Brands", icon: "🏢", color: "bg-slate-100 text-slate-700", category: "Content" },
    faq: { label: "FAQ Accordion", icon: "❓", color: "bg-orange-100 text-orange-700", category: "Content" },
    custom_html: { label: "Custom HTML Block", icon: "🖥️", color: "bg-gray-100 text-gray-700", category: "Utility" },
    whatsapp_fab: { label: "WhatsApp FAB", icon: "💬", color: "bg-green-100 text-green-700", category: "Utility" },
    spacer: { label: "Spacer / Divider", icon: "➖", color: "bg-gray-100 text-gray-500", category: "Utility" },
};

const ALL_SECTION_TYPES = Object.keys(SECTION_META);

/* ─── Add Section Picker ─────────────────────────────────────────────── */
const SECTION_DEFAULTS = {
    hero: { config: {} },
    top_micro_bar: { config: { textLeft: "Express 2-Hour Delivery in Karachi, Lahore & Islamabad", textMiddle: "100% Genuine & Licensed", phone: "(021) 111-633-422", bgColor: "#1E5128", textColor: "#D5EAC3", style: "classic" } },
    announcement_bar: { config: { text: "Free delivery on orders above Rs. 999!", bgColor: "#1e4d28", textColor: "#FFFFFF", link: "/products", linkText: "Shop Now" } },
    trust_badges: { config: { badges: [{ icon: "ShieldCheck", title: "100% Genuine", desc: "Licensed pharmacy sourcing" }, { icon: "Truck", title: "2-Hour Delivery", desc: "Major cities covered" }] } },
    stats_counter: { config: { stats: [{ value: "50K+", label: "Happy Customers" }, { value: "2 hrs", label: "Avg. Delivery" }] } },
    categories: { config: { title: "Browse Categories", subtitle: "Quick Access", ctaText: "All Products", ctaLink: "/products" } },
    ribbon: { config: { title: "Everyday Must-Haves", subtitle: "Essential Picks", ctaText: "View All", ctaLink: "/products", productSource: "top_sellers", productCount: 6 } },
    promo_banners: { config: { banners: [{ badge: "Sale", badgeColor: "#4d8d3a", title: "Banner Title", desc: "Description here.", ctaText: "Shop Now", ctaLink: "/products", bgFrom: "#F0F9E6", bgTo: "#DCF0C4", borderColor: "#C8E2AC", ctaColor: "#1e4d28" }, { badge: "New", badgeColor: "#0EA5E9", title: "Banner Title 2", desc: "Description here.", ctaText: "Shop Now", ctaLink: "/products", bgFrom: "#E8F4FB", bgTo: "#CCE8F7", borderColor: "#B0D8F0", ctaColor: "#0369A1" }] } },
    payment_strip: { config: { title: "EXTRA 25% OFF with Bank Cards", subtitle: "Applies at checkout.", ctaText: "View Offers", ctaLink: "/promotions" } },
    rx_upload_cta: { config: { title: "Upload Your Prescription", subtitle: "Get medicines delivered in 2 hours.", ctaText: "Upload Now", ctaLink: "/upload-prescription", bgColor: "#1e4d28" } },
    flash_sale: { config: { title: "Flash Sale", subtitle: "Limited Time Offers", endTime: null, productSource: "on_sale", productCount: 6 } },
    products_grid: { config: { title: "Products", subtitle: "Picks", ctaText: "View All", ctaLink: "/products", productSource: "top_sellers", productCount: 6, gridVariant: "standard" } },
    mid_banners: { config: { banners: [{ badge: "Category", title: "Banner Title", desc: "Description.", ctaText: "Shop Now", ctaLink: "/products", bgFrom: "#1B3B5F", bgTo: "#2B5B8F", badgeColor: "#BAE6FD" }, { badge: "Category", title: "Banner Title 2", desc: "Description.", ctaText: "Shop Now", ctaLink: "/products", bgFrom: "#5B2A36", bgTo: "#8C3A4F", badgeColor: "#FECACA" }] } },
    single_mid_banner: { config: { badge: "Special Offer", title: "Full Width Banner", desc: "Great for big announcements.", ctaText: "Shop Now", ctaLink: "/products", bgFrom: "#1e4d28", bgTo: "#4d8d3a", badgeColor: "#dcfce7", image: "", imagekitFileId: "" } },
    featured_category: { config: { badge: "Featured", title: "Category Title", desc: "Description here.", ctaText: "Shop Now", ctaLink: "/products", bgColor: "#1E3A5F", image: "" } },
    conditions: { config: { title: "Care By Condition", subtitle: "Health Concerns", conditions: [{ name: "Condition Name", desc: "Description", icon: "Activity" }] } },
    testimonials: { config: { title: "What Our Customers Say", subtitle: "Reviews", testimonials: [{ name: "Customer Name", rating: 5, comment: "Great service!", city: "Karachi" }] } },
    app_download: { config: { title: "Download & Get\n10% Off", subtitle: "Track orders, set reminders.", appStoreLink: "#", playStoreLink: "#", rating: "4.9", reviewCount: "50K+" } },
    newsletter: { config: { title: "Stay Informed", subtitle: "Subscribe for deals & tips.", placeholder: "Enter your email", ctaText: "Subscribe", bgColor: "#ebf7d9" } },
    blogs: { config: { title: "Health Advice & Blogs", subtitle: "Expert Insights", ctaText: "All Articles", ctaLink: "/about-us", blogs: [{ title: "Blog Title", readTime: "3 min read", category: "Health", author: "Dr. Author", icon: "Apple", accentColor: "#4d8d3a" }] } },
    brands: { config: { title: "Trusted Partner Brands", subtitle: "Our Manufacturers", brands: [{ name: "Brand Name", abbr: "BRD" }] } },
    faq: { config: { title: "Frequently Asked Questions", subtitle: "Got Questions?", faqs: [{ q: "Question?", a: "Answer." }] } },
    custom_html: { config: { html: "<!-- Add your custom HTML here -->", label: "Custom Block" } },
    whatsapp_fab: { config: { phoneNumber: "+923001234567", message: "Hello! I need help with my order.", position: "right" } },
    spacer: { config: { height: 40, showDivider: false, dividerColor: "#E5E7EB" } },
};

/* ─── Section Edit Forms ─────────────────────────────────────────────── */
const TextField = ({ label, value, onChange, placeholder, multiline = false }) => (
    <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
        {multiline ? (
            <textarea
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
        ) : (
            <input
                type="text"
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        )}
    </div>
);

const ColorField = ({ label, value, onChange }) => (
    <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
        <div className="flex items-center gap-2">
            <input type="color" value={value || "#000000"} onChange={e => onChange(e.target.value)}
                className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
            <input type="text" value={value || ""} onChange={e => onChange(e.target.value)}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="#000000" />
        </div>
    </div>
);

const NumberField = ({ label, value, onChange, min, max }) => (
    <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
        <input type="number" value={value ?? ""} onChange={e => onChange(Number(e.target.value))} min={min} max={max}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
);

const SelectField = ({ label, value, onChange, options }) => (
    <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
        <select value={value || ""} onChange={e => onChange(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
);

const ImageField = ({
    label,
    value,
    fileId,
    onChange,
    recommendedSize = "",
    aspectRatio = "",
    formatHint = "WebP, PNG, JPG (Max 2MB)",
}) => {
    const { uploadImage, deleteImage, loading } = useUploadHomePageImage();
    const [detectedDimensions, setDetectedDimensions] = useState(null);

    // Detect natural dimensions whenever value changes
    useEffect(() => {
        if (!value) {
            setDetectedDimensions(null);
            return;
        }
        const img = new window.Image();
        img.onload = () => {
            setDetectedDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight,
            });
        };
        img.onerror = () => setDetectedDimensions(null);
        img.src = value;
    }, [value]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // If there's an existing image, delete it from cloud first
        if (fileId) {
            await deleteImage(fileId);
        }

        const data = await uploadImage(file);
        if (data?.success) {
            onChange(data.url, data.fileId);
        } else {
            toast.error("Failed to upload image");
        }
    };

    const handleDelete = async () => {
        if (fileId) {
            await deleteImage(fileId);
        }
        onChange("", "");
        setDetectedDimensions(null);
    };

    return (
        <div className="mb-4 bg-white p-3.5 rounded-xl border border-gray-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1.5">
                <label className="block text-xs font-bold text-gray-700">{label}</label>
                {recommendedSize && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        📏 Rec: {recommendedSize}
                    </span>
                )}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value, fileId)}
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 focus:bg-white transition-colors"
                    placeholder="https://..."
                />
                <label className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 rounded-lg cursor-pointer text-xs font-bold border border-gray-200 transition-colors shrink-0">
                    {loading ? <Loader2 size={15} className="animate-spin" /> : "Upload"}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            </div>

            {/* Size & Format Guidance Subtext */}
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400 font-medium flex-wrap gap-1">
                <span>
                    {aspectRatio && <strong className="text-gray-600 font-semibold">Ratio: {aspectRatio} • </strong>}
                    {formatHint}
                </span>
                {detectedDimensions && (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                        Current: {detectedDimensions.width} × {detectedDimensions.height} px
                    </span>
                )}
            </div>

            {value && (
                <div className="mt-2.5 h-24 w-40 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center relative group shadow-2xs">
                    <img
                        src={value}
                        alt="preview"
                        className="h-full w-full object-contain"
                        onError={(e) => (e.target.style.display = "none")}
                    />
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="absolute top-1.5 right-1.5 bg-white/95 hover:bg-red-50 text-red-600 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-all shadow-xs cursor-pointer"
                        title="Remove Image"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            )}
        </div>
    );
};

const SectionDivider = ({ label }) => (
    <div className="flex items-center gap-2 my-4">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
        <div className="flex-1 h-px bg-gray-100" />
    </div>
);

/* ─── Individual section edit forms ─────────────────────────────────── */
const EditForm = ({ section, onChange }) => {
    const cfg = section.config || {};
    const set = (key, val) => onChange({ ...section, config: { ...cfg, [key]: val } });

    const { getAllVendors } = useGetAllVendors();
    const [dbVendors, setDbVendors] = useState([]);
    const [brandUI, setBrandUI] = useState({ isOpen: false, tab: "manual", editingManualIdx: null });
    const [showRibbonPicker, setShowRibbonPicker] = useState(false);

    useEffect(() => {
        if (section.type === "brands") {
            getAllVendors().then(res => {
                if (res?.success) setDbVendors(res.vendors || []);
            });
        }
    }, [section.type]);

    switch (section.type) {
        case "hero":
            return (
                <div className="p-1">
                    <HeroManager />
                </div>
            );

        case "announcement_bar":
            return (
                <div>
                    <TextField label="Announcement Text" value={cfg.text} onChange={v => set("text", v)} placeholder="Free delivery on orders above Rs. 999!" />
                    <TextField label="Link URL" value={cfg.link} onChange={v => set("link", v)} placeholder="/products" />
                    <TextField label="Link Button Text" value={cfg.linkText} onChange={v => set("linkText", v)} placeholder="Shop Now" />
                    <ColorField label="Background Color" value={cfg.bgColor} onChange={v => set("bgColor", v)} />
                    <ColorField label="Text Color" value={cfg.textColor} onChange={v => set("textColor", v)} />
                </div>
            );

        case "top_micro_bar":
            return (
                <div>
                    <div className="mb-3">
                        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Style Variant</label>
                        <select className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                            value={cfg.style || "classic"} onChange={(e) => set("style", e.target.value)}>
                            <option value="classic">Classic (3 Columns)</option>
                            <option value="marquee">Marquee (Scrolling)</option>
                            <option value="centered">Centered Text</option>
                        </select>
                    </div>
                    <TextField label="Left Text (or Main Text)" value={cfg.textLeft} onChange={v => set("textLeft", v)} placeholder="Express 2-Hour Delivery" />
                    {cfg.style === "classic" && (
                        <>
                            <TextField label="Middle Text" value={cfg.textMiddle} onChange={v => set("textMiddle", v)} placeholder="100% Genuine & Licensed" />
                            <TextField label="Phone Number" value={cfg.phone} onChange={v => set("phone", v)} placeholder="(021) 111-633-422" />
                        </>
                    )}
                    <ColorField label="Background Color" value={cfg.bgColor} onChange={v => set("bgColor", v)} />
                    <ColorField label="Text Color" value={cfg.textColor} onChange={v => set("textColor", v)} />
                </div>
            );

        case "trust_badges":
            return (
                <div>
                    {(cfg.badges || []).map((badge, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl p-3 mb-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-500">Badge {i + 1}</span>
                                <button onClick={() => set("badges", cfg.badges.filter((_, idx) => idx !== i))}
                                    className="text-red-400 hover:text-red-600 transition-colors">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                            <TextField label="Title" value={badge.title} onChange={v => set("badges", cfg.badges.map((b, idx) => idx === i ? { ...b, title: v } : b))} />
                            <TextField label="Description" value={badge.desc} onChange={v => set("badges", cfg.badges.map((b, idx) => idx === i ? { ...b, desc: v } : b))} />
                        </div>
                    ))}
                    <button onClick={() => set("badges", [...(cfg.badges || []), { icon: "ShieldCheck", title: "New Badge", desc: "Description" }])}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-semibold text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-1">
                        <Plus size={13} /> Add Badge
                    </button>
                </div>
            );

        case "stats_counter":
            return (
                <div>
                    {(cfg.stats || []).map((stat, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl p-3 mb-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-500">Stat {i + 1}</span>
                                <button onClick={() => set("stats", cfg.stats.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                            </div>
                            <TextField label="Value" value={stat.value} onChange={v => set("stats", cfg.stats.map((s, idx) => idx === i ? { ...s, value: v } : s))} placeholder="50K+" />
                            <TextField label="Label" value={stat.label} onChange={v => set("stats", cfg.stats.map((s, idx) => idx === i ? { ...s, label: v } : s))} placeholder="Happy Customers" />
                        </div>
                    ))}
                    <button onClick={() => set("stats", [...(cfg.stats || []), { value: "0+", label: "New Stat" }])}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-semibold text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-1">
                        <Plus size={13} /> Add Stat
                    </button>
                </div>
            );

        case "categories":
            return (
                <div>
                    <TextField label="Section Title" value={cfg.title} onChange={v => set("title", v)} />
                    <TextField label="Subtitle (badge)" value={cfg.subtitle} onChange={v => set("subtitle", v)} />
                    <TextField label="CTA Button Text" value={cfg.ctaText} onChange={v => set("ctaText", v)} />
                    <TextField label="CTA Link" value={cfg.ctaLink} onChange={v => set("ctaLink", v)} />
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-xs text-teal-700">
                        📂 Categories are pulled from the <strong>Categories</strong> database automatically.
                    </div>
                </div>
            );

        case "ribbon": {
            const ribbonProducts = cfg.selectedProducts || [];
            return (
                <div>
                    <TextField label="Section Title" value={cfg.title} onChange={v => set("title", v)} />
                    <TextField label="Subtitle" value={cfg.subtitle} onChange={v => set("subtitle", v)} />
                    <TextField label="CTA Text" value={cfg.ctaText} onChange={v => set("ctaText", v)} />
                    <TextField label="CTA Link" value={cfg.ctaLink} onChange={v => set("ctaLink", v)} />

                    <SectionDivider label={`Selected Products (${ribbonProducts.length})`} />

                    {/* Selected products grid */}
                    {ribbonProducts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {ribbonProducts.map((p, i) => (
                                <div key={p._id || i} className="bg-white border border-gray-200 rounded-xl p-2 flex items-center gap-2 relative group shadow-sm">
                                    <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0 p-0.5">
                                        <img
                                            src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${p.image}`}
                                            alt={p.name}
                                            className="w-full h-full object-contain"
                                            onError={e => { e.target.src = "https://placehold.co/80x80/F2F8ED/7ec142?text=P"; }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-semibold text-gray-800 line-clamp-2 leading-tight">{p.name}</p>
                                        <p className="text-[9px] text-primary font-bold mt-0.5">PKR {p.price?.toLocaleString()}</p>
                                    </div>
                                    <button
                                        onClick={() => set("selectedProducts", ribbonProducts.filter((_, idx) => idx !== i))}
                                        className="absolute top-1 right-1 p-0.5 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mb-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                            <Package size={22} className="mx-auto mb-1.5 text-gray-300" />
                            <p className="text-xs text-gray-400 font-medium">No products selected yet.</p>
                            <p className="text-[10px] text-gray-300 mt-0.5">Click "Add Products" below to pick some.</p>
                        </div>
                    )}

                    {/* Toggle picker */}
                    <button
                        onClick={() => setShowRibbonPicker(v => !v)}
                        className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-primary/30 hover:border-primary text-primary hover:bg-primary/5 rounded-xl text-xs font-bold transition-colors mb-3"
                    >
                        <Plus size={14} />
                        {showRibbonPicker ? "Hide Product Picker" : "Add Products"}
                    </button>

                    {showRibbonPicker && (
                        <div className="border border-gray-200 rounded-xl overflow-hidden mb-2">
                            <ProductSelector
                                selectedProducts={ribbonProducts}
                                onChange={selected => set("selectedProducts", selected)}
                                multiple={true}
                            />
                        </div>
                    )}
                </div>
            );
        }

        case "promo_banners":
        case "mid_banners":
            return (
                <div>
                    {(cfg.banners || []).map((banner, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl p-3 mb-4 bg-gray-50">
                            <p className="text-xs font-bold text-gray-500 mb-3">Banner {i + 1}</p>
                            <TextField label="Badge Text" value={banner.badge} onChange={v => set("banners", cfg.banners.map((b, idx) => idx === i ? { ...b, badge: v } : b))} />
                            <TextField label="Title" value={banner.title} onChange={v => set("banners", cfg.banners.map((b, idx) => idx === i ? { ...b, title: v } : b))} />
                            <TextField label="Description" value={banner.desc} onChange={v => set("banners", cfg.banners.map((b, idx) => idx === i ? { ...b, desc: v } : b))} multiline />
                            <TextField label="CTA Text" value={banner.ctaText} onChange={v => set("banners", cfg.banners.map((b, idx) => idx === i ? { ...b, ctaText: v } : b))} />
                            <TextField label="CTA Link" value={banner.ctaLink} onChange={v => set("banners", cfg.banners.map((b, idx) => idx === i ? { ...b, ctaLink: v } : b))} />
                            {section.type === "promo_banners" && (
                                <>
                                    <ColorField label="Badge Color" value={banner.badgeColor} onChange={v => set("banners", cfg.banners.map((b, idx) => idx === i ? { ...b, badgeColor: v } : b))} />
                                    <ColorField label="BG Gradient From" value={banner.bgFrom} onChange={v => set("banners", cfg.banners.map((b, idx) => idx === i ? { ...b, bgFrom: v } : b))} />
                                    <ColorField label="BG Gradient To" value={banner.bgTo} onChange={v => set("banners", cfg.banners.map((b, idx) => idx === i ? { ...b, bgTo: v } : b))} />
                                    <ColorField label="CTA Color" value={banner.ctaColor} onChange={v => set("banners", cfg.banners.map((b, idx) => idx === i ? { ...b, ctaColor: v } : b))} />
                                    <ImageField
                                        label="Banner Graphic / Background Image (Optional)"
                                        value={banner.image}
                                        fileId={banner.imagekitFileId}
                                        recommendedSize="600 × 350 px"
                                        aspectRatio="16:9 or 4:3"
                                        formatHint="WebP, PNG, JPG (Max 2MB)"
                                        onChange={(url, fileId) => set("banners", cfg.banners.map((b, idx) => idx === i ? { ...b, image: url, imagekitFileId: fileId } : b))}
                                    />
                                </>
                            )}
                            {section.type === "mid_banners" && (
                                <>
                                    <ColorField label="Badge Color" value={banner.badgeColor} onChange={v => set("banners", cfg.banners.map((b, idx) => idx === i ? { ...b, badgeColor: v } : b))} />
                                    <ColorField label="Gradient From" value={banner.bgFrom} onChange={v => set("banners", cfg.banners.map((b, idx) => idx === i ? { ...b, bgFrom: v } : b))} />
                                    <ColorField label="Gradient To" value={banner.bgTo} onChange={v => set("banners", cfg.banners.map((b, idx) => idx === i ? { ...b, bgTo: v } : b))} />
                                    <ImageField 
                                        label="Banner Image (Optional)" 
                                        value={banner.image} 
                                        fileId={banner.imagekitFileId}
                                        recommendedSize="600 × 300 px"
                                        aspectRatio="2:1 (Side-by-side banner)"
                                        formatHint="WebP, PNG, JPG (Max 2MB)"
                                        onChange={(url, fileId) => set("banners", cfg.banners.map((b, idx) => idx === i ? { ...b, image: url, imagekitFileId: fileId } : b))} 
                                    />
                                </>
                            )}
                        </div>
                    ))}
                </div>
            );

        case "single_mid_banner":
            return (
                <div>
                    <TextField label="Badge Text" value={cfg.badge} onChange={v => set("badge", v)} />
                    <TextField label="Title" value={cfg.title} onChange={v => set("title", v)} />
                    <TextField label="Description" value={cfg.desc} onChange={v => set("desc", v)} multiline />
                    <TextField label="CTA Text" value={cfg.ctaText} onChange={v => set("ctaText", v)} />
                    <TextField label="CTA Link" value={cfg.ctaLink} onChange={v => set("ctaLink", v)} />
                    <ColorField label="Badge Color" value={cfg.badgeColor} onChange={v => set("badgeColor", v)} />
                    <ColorField label="Gradient From" value={cfg.bgFrom} onChange={v => set("bgFrom", v)} />
                    <ColorField label="Gradient To" value={cfg.bgTo} onChange={v => set("bgTo", v)} />
                    <ImageField 
                        label="Full-Width Banner Image (Optional)" 
                        value={cfg.image} 
                        fileId={cfg.imagekitFileId}
                        recommendedSize="1200 × 350 px"
                        aspectRatio="3.4:1 (Ultra-wide desktop banner)"
                        formatHint="WebP, PNG, JPG (Max 2MB)"
                        onChange={(url, fileId) => { set("image", url); set("imagekitFileId", fileId); }} 
                    />
                </div>
            );

        case "payment_strip":
            return (
                <div>
                    <TextField label="Main Heading" value={cfg.title} onChange={v => set("title", v)} />
                    <TextField label="Sub Text" value={cfg.subtitle} onChange={v => set("subtitle", v)} multiline />
                    <TextField label="Button Text" value={cfg.ctaText} onChange={v => set("ctaText", v)} />
                    <TextField label="Button Link" value={cfg.ctaLink} onChange={v => set("ctaLink", v)} />
                </div>
            );

        case "rx_upload_cta":
            return (
                <div>
                    <TextField label="Heading" value={cfg.title} onChange={v => set("title", v)} />
                    <TextField label="Subtitle" value={cfg.subtitle} onChange={v => set("subtitle", v)} multiline />
                    <TextField label="Button Text" value={cfg.ctaText} onChange={v => set("ctaText", v)} />
                    <TextField label="Button Link" value={cfg.ctaLink} onChange={v => set("ctaLink", v)} />
                    <ColorField label="Background Color" value={cfg.bgColor} onChange={v => set("bgColor", v)} />
                </div>
            );

        case "flash_sale":
            return (
                <div>
                    <TextField label="Section Title" value={cfg.title} onChange={v => set("title", v)} />
                    <TextField label="Subtitle" value={cfg.subtitle} onChange={v => set("subtitle", v)} />
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sale End Date & Time</label>
                        <input type="datetime-local" value={cfg.endTime ? new Date(cfg.endTime).toISOString().slice(0, 16) : ""}
                            onChange={e => set("endTime", e.target.value ? new Date(e.target.value).toISOString() : null)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <SelectField label="Products Source" value={cfg.productSource} onChange={v => set("productSource", v)}
                        options={[{ value: "on_sale", label: "On Sale" }, { value: "featured", label: "Featured" }, { value: "top_sellers", label: "Top Sellers" }]} />
                    <NumberField label="Product Count" value={cfg.productCount} onChange={v => set("productCount", v)} min={2} max={12} />
                </div>
            );

        case "products_grid":
            return (
                <div>
                    <TextField label="Section Title" value={cfg.title} onChange={v => set("title", v)} />
                    <TextField label="Subtitle (badge)" value={cfg.subtitle} onChange={v => set("subtitle", v)} />
                    <TextField label="CTA Button Text" value={cfg.ctaText} onChange={v => set("ctaText", v)} />
                    <TextField label="CTA Link" value={cfg.ctaLink} onChange={v => set("ctaLink", v)} />
                    <SelectField label="Product Source" value={cfg.productSource} onChange={v => set("productSource", v)}
                        options={[{ value: "top_sellers", label: "Top Sellers" }, { value: "featured", label: "Featured" }, { value: "on_sale", label: "On Sale" }, { value: "new_arrivals", label: "New Arrivals" }]} />
                    <NumberField label="Product Count" value={cfg.productCount} onChange={v => set("productCount", v)} min={2} max={12} />
                </div>
            );

        case "featured_category":
            return (
                <div>
                    <TextField label="Badge Text" value={cfg.badge} onChange={v => set("badge", v)} />
                    <TextField label="Title" value={cfg.title} onChange={v => set("title", v)} />
                    <TextField label="Description" value={cfg.desc} onChange={v => set("desc", v)} multiline />
                    <TextField label="CTA Text" value={cfg.ctaText} onChange={v => set("ctaText", v)} />
                    <TextField label="CTA Link" value={cfg.ctaLink} onChange={v => set("ctaLink", v)} />
                    <ColorField label="Background Color" value={cfg.bgColor} onChange={v => set("bgColor", v)} />
                    <ImageField 
                        label="Featured Graphic / Banner Image (Optional)" 
                        value={cfg.image} 
                        fileId={cfg.imagekitFileId}
                        recommendedSize="500 × 500 px"
                        aspectRatio="1:1 (Square)"
                        formatHint="Transparent PNG, WebP, JPG"
                        onChange={(url, fileId) => { set("image", url); set("imagekitFileId", fileId); }} 
                    />
                </div>
            );

        case "conditions":
            return (
                <div>
                    <TextField label="Section Title" value={cfg.title} onChange={v => set("title", v)} />
                    <TextField label="Subtitle" value={cfg.subtitle} onChange={v => set("subtitle", v)} />
                    <SectionDivider label="Conditions" />
                    {(cfg.conditions || []).map((cond, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl p-3 mb-3 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500">Condition {i + 1}</span>
                                <button onClick={() => set("conditions", cfg.conditions.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                            </div>
                            <TextField label="Name" value={cond.name} onChange={v => set("conditions", cfg.conditions.map((c, idx) => idx === i ? { ...c, name: v } : c))} />
                            <TextField label="Description" value={cond.desc} onChange={v => set("conditions", cfg.conditions.map((c, idx) => idx === i ? { ...c, desc: v } : c))} />
                        </div>
                    ))}
                    <button onClick={() => set("conditions", [...(cfg.conditions || []), { name: "New Condition", desc: "Description", icon: "Activity" }])}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-semibold text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-1">
                        <Plus size={13} /> Add Condition
                    </button>
                </div>
            );

        case "testimonials":
            return (
                <div>
                    <TextField label="Section Title" value={cfg.title} onChange={v => set("title", v)} />
                    <TextField label="Subtitle" value={cfg.subtitle} onChange={v => set("subtitle", v)} />
                    <SectionDivider label="Testimonials" />
                    {(cfg.testimonials || []).map((t, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl p-3 mb-3 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500">Review {i + 1}</span>
                                <button onClick={() => set("testimonials", cfg.testimonials.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                            </div>
                            <TextField label="Customer Name" value={t.name} onChange={v => set("testimonials", cfg.testimonials.map((x, idx) => idx === i ? { ...x, name: v } : x))} />
                            <TextField label="City" value={t.city} onChange={v => set("testimonials", cfg.testimonials.map((x, idx) => idx === i ? { ...x, city: v } : x))} />
                            <TextField label="Comment" value={t.comment} onChange={v => set("testimonials", cfg.testimonials.map((x, idx) => idx === i ? { ...x, comment: v } : x))} multiline />
                            <NumberField label="Rating (1-5)" value={t.rating} onChange={v => set("testimonials", cfg.testimonials.map((x, idx) => idx === i ? { ...x, rating: Math.min(5, Math.max(1, v)) } : x))} min={1} max={5} />
                        </div>
                    ))}
                    <button onClick={() => set("testimonials", [...(cfg.testimonials || []), { name: "Customer", rating: 5, comment: "Great service!", city: "Karachi" }])}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-semibold text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-1">
                        <Plus size={13} /> Add Testimonial
                    </button>
                </div>
            );

        case "app_download":
            return (
                <div>
                    <TextField label="Main Heading" value={cfg.title} onChange={v => set("title", v)} multiline />
                    <TextField label="Subtitle" value={cfg.subtitle} onChange={v => set("subtitle", v)} multiline />
                    <TextField label="Rating" value={cfg.rating} onChange={v => set("rating", v)} placeholder="4.9" />
                    <TextField label="Review Count" value={cfg.reviewCount} onChange={v => set("reviewCount", v)} placeholder="50K+" />
                    <TextField label="App Store Link" value={cfg.appStoreLink} onChange={v => set("appStoreLink", v)} placeholder="#" />
                    <TextField label="Google Play Link" value={cfg.playStoreLink} onChange={v => set("playStoreLink", v)} placeholder="#" />
                </div>
            );

        case "newsletter":
            return (
                <div>
                    <TextField label="Heading" value={cfg.title} onChange={v => set("title", v)} />
                    <TextField label="Subtitle" value={cfg.subtitle} onChange={v => set("subtitle", v)} />
                    <TextField label="Input Placeholder" value={cfg.placeholder} onChange={v => set("placeholder", v)} />
                    <TextField label="Button Text" value={cfg.ctaText} onChange={v => set("ctaText", v)} />
                    <ColorField label="Background Color" value={cfg.bgColor} onChange={v => set("bgColor", v)} />
                </div>
            );

        case "blogs":
            return (
                <div>
                    <TextField label="Section Title" value={cfg.title} onChange={v => set("title", v)} />
                    <TextField label="Subtitle" value={cfg.subtitle} onChange={v => set("subtitle", v)} />
                    <TextField label="CTA Text" value={cfg.ctaText} onChange={v => set("ctaText", v)} />
                    <TextField label="CTA Link" value={cfg.ctaLink} onChange={v => set("ctaLink", v)} />
                    <SectionDivider label="Blog Cards" />
                    {(cfg.blogs || []).map((blog, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl p-3 mb-3 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500">Blog {i + 1}</span>
                                <button onClick={() => set("blogs", cfg.blogs.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                            </div>
                            <TextField label="Title" value={blog.title} onChange={v => set("blogs", cfg.blogs.map((b, idx) => idx === i ? { ...b, title: v } : b))} />
                            <TextField label="Category" value={blog.category} onChange={v => set("blogs", cfg.blogs.map((b, idx) => idx === i ? { ...b, category: v } : b))} />
                            <TextField label="Author" value={blog.author} onChange={v => set("blogs", cfg.blogs.map((b, idx) => idx === i ? { ...b, author: v } : b))} />
                            <TextField label="Read Time" value={blog.readTime} onChange={v => set("blogs", cfg.blogs.map((b, idx) => idx === i ? { ...b, readTime: v } : b))} placeholder="5 min read" />
                            <ColorField label="Accent Color" value={blog.accentColor} onChange={v => set("blogs", cfg.blogs.map((b, idx) => idx === i ? { ...b, accentColor: v } : b))} />
                        </div>
                    ))}
                    <button onClick={() => set("blogs", [...(cfg.blogs || []), { title: "New Blog Post", readTime: "3 min read", category: "Health", author: "Dr. Author", icon: "Apple", accentColor: "#4d8d3a" }])}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-semibold text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-1">
                        <Plus size={13} /> Add Blog
                    </button>
                </div>
            );

        case "brands": {
            const currentSources = cfg.sources || (cfg.source ? [cfg.source] : ["manual"]);
            
            const toggleSource = (src) => {
                if (currentSources.includes(src)) {
                    set("sources", currentSources.filter(s => s !== src));
                } else {
                    set("sources", [...currentSources, src]);
                }
            };

            const DEFAULT_BRANDS = [
                { name: "GSK Healthcare", abbr: "GSK" },
                { name: "Abbott Laboratories", abbr: "ABT" },
                { name: "Bayer Pharma", abbr: "BAY" },
                { name: "Reckitt Benckiser", abbr: "RKT" },
                { name: "Pfizer Health", abbr: "PFZ" },
                { name: "Sanofi Pasteur", abbr: "SNF" },
                { name: "Getz Pharma", abbr: "GTZ" },
            ];
            const manualBrands = cfg.brands !== undefined ? cfg.brands : DEFAULT_BRANDS;
            const selectedVendorIds = cfg.selectedVendors || [];
            const selectedVendors = dbVendors.filter(v => selectedVendorIds.includes(v._id));

            if (brandUI.isOpen) {
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                        <button onClick={() => setBrandUI({ ...brandUI, isOpen: false })} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-4 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg w-max transition-colors">
                            ← Back to Brands List
                        </button>
                        
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-4">
                            <button onClick={() => setBrandUI({ ...brandUI, tab: "vendors" })} className={`flex-1 text-xs font-bold py-2 rounded-md transition-colors ${brandUI.tab === "vendors" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                                From Directory
                            </button>
                            <button onClick={() => setBrandUI({ ...brandUI, tab: "manual" })} className={`flex-1 text-xs font-bold py-2 rounded-md transition-colors ${brandUI.tab === "manual" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                                Custom Brand
                            </button>
                        </div>

                        {brandUI.tab === "vendors" && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Select Vendors</h4>
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                                        {dbVendors.length === 0 ? (
                                            <p className="p-4 text-center text-xs text-gray-500">No vendors found in directory.</p>
                                        ) : (
                                            dbVendors.map(vendor => {
                                                const isSelected = selectedVendorIds.includes(vendor._id);
                                                return (
                                                    <label key={vendor._id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-blue-50 border border-blue-100" : "hover:bg-gray-50 border border-transparent"}`}>
                                                        <input type="checkbox" checked={isSelected}
                                                            onChange={() => {
                                                                if (isSelected) set("selectedVendors", selectedVendorIds.filter(id => id !== vendor._id));
                                                                else set("selectedVendors", [...selectedVendorIds, vendor._id]);
                                                                
                                                                // Also make sure 'vendors' is in sources if they select one
                                                                if (!isSelected && !currentSources.includes("vendors")) {
                                                                    set("sources", [...currentSources, "vendors"]);
                                                                }
                                                            }}
                                                            className="rounded text-blue-500" />
                                                        <div className="w-8 h-8 rounded bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                                            {vendor.image ? <img src={vendor.image} className="w-full h-full object-contain" /> : <span className="text-[10px] font-bold text-gray-400">{vendor.name.substring(0,2).toUpperCase()}</span>}
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-700">{vendor.name}</span>
                                                    </label>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                     <button disabled className="flex-1 py-2 bg-gray-50 text-gray-400 text-xs font-semibold rounded-lg border border-gray-200 cursor-not-allowed">Suppliers (Soon)</button>
                                     <button disabled className="flex-1 py-2 bg-gray-50 text-gray-400 text-xs font-semibold rounded-lg border border-gray-200 cursor-not-allowed">Manufacturers (Soon)</button>
                                </div>
                            </div>
                        )}

                        {brandUI.tab === "manual" && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">
                                    {brandUI.editingManualIdx !== null ? "Edit Custom Brand" : "Add Custom Brand"}
                                </h4>
                                
                                {(() => {
                                    const idx = brandUI.editingManualIdx;
                                    const brand = idx !== null ? manualBrands[idx] : { name: "", abbr: "", image: "", imagekitFileId: "" };
                                    
                                    const updateField = (key, val) => {
                                        if (idx !== null) {
                                            set("brands", manualBrands.map((b, i) => i === idx ? { ...b, [key]: val } : b));
                                        } else {
                                            const newBrands = [...manualBrands, { name: "", abbr: "", image: "", imagekitFileId: "", [key]: val }];
                                            const newSources = currentSources.includes("manual") ? currentSources : [...currentSources, "manual"];
                                            onChange({ ...section, config: { ...cfg, brands: newBrands, sources: newSources }});
                                            setBrandUI({ ...brandUI, editingManualIdx: newBrands.length - 1 });
                                        }
                                    };

                                    return (
                                        <div className="space-y-4">
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Brand Name</label>
                                                    <input value={brand.name} onChange={e => updateField("name", e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" placeholder="e.g. Acme Corp" />
                                                </div>
                                                <div className="w-20 shrink-0">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Abbr</label>
                                                    <input value={brand.abbr} onChange={e => updateField("abbr", e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-center" placeholder="ACM" />
                                                </div>
                                            </div>
                                            <ImageField 
                                                label="Brand Logo Image" 
                                                value={brand.image} 
                                                fileId={brand.imagekitFileId}
                                                recommendedSize="240 × 120 px"
                                                aspectRatio="2:1 (Horizontal Logo)"
                                                formatHint="Transparent PNG / SVG / WebP"
                                                onChange={(url, fileId) => {
                                                    if (idx !== null) {
                                                        set("brands", manualBrands.map((b, i) => i === idx ? { ...b, image: url, imagekitFileId: fileId } : b));
                                                    } else {
                                                        const newBrands = [...manualBrands, { name: brand.name, abbr: brand.abbr, image: url, imagekitFileId: fileId }];
                                                        const newSources = currentSources.includes("manual") ? currentSources : [...currentSources, "manual"];
                                                        onChange({ ...section, config: { ...cfg, brands: newBrands, sources: newSources }});
                                                        setBrandUI({ ...brandUI, editingManualIdx: newBrands.length - 1 });
                                                    }
                                                }}
                                            />
                                        </div>
                                    )
                                })()}
                            </div>
                        )}
                    </div>
                );
            }

            return (
                <div className="animate-in fade-in duration-200">
                    <TextField label="Section Title" value={cfg.title} onChange={v => set("title", v)} />
                    <TextField label="Subtitle" value={cfg.subtitle} onChange={v => set("subtitle", v)} />
                    
                    <SectionDivider label="Added Brands" />
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {/* Render Manual Brands */}
                        {manualBrands.map((brand, i) => (
                            <div key={`manual-${i}`} className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center relative group shadow-sm hover:shadow-md transition-shadow">
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setBrandUI({ isOpen: true, tab: "manual", editingManualIdx: i })} className="p-1 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-md">
                                        <Settings2 size={12} />
                                    </button>
                                    <button onClick={() => set("brands", manualBrands.filter((_, idx) => idx !== i))} className="p-1 text-red-500 bg-red-50 hover:bg-red-100 rounded-md">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center mb-2 overflow-hidden border border-gray-100 p-1">
                                    {brand.image ? <img src={brand.image} className="w-full h-full object-contain" /> : <span className="text-[10px] font-bold text-gray-400">{brand.abbr || "NA"}</span>}
                                </div>
                                <span className="text-xs font-semibold text-gray-800 text-center line-clamp-1">{brand.name || "Unnamed"}</span>
                                <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 rounded uppercase mt-1">Custom</span>
                            </div>
                        ))}

                        {/* Render Selected Vendors */}
                        {selectedVendors.map(vendor => (
                            <div key={`vendor-${vendor._id}`} className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center relative group shadow-sm hover:shadow-md transition-shadow">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => set("selectedVendors", selectedVendorIds.filter(id => id !== vendor._id))} className="p-1 text-red-500 bg-red-50 hover:bg-red-100 rounded-md">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center mb-2 overflow-hidden border border-gray-100 p-1">
                                    {vendor.image ? <img src={vendor.image} className="w-full h-full object-contain" /> : <span className="text-[10px] font-bold text-gray-400">{vendor.name.substring(0,2).toUpperCase()}</span>}
                                </div>
                                <span className="text-xs font-semibold text-gray-800 text-center line-clamp-1">{vendor.name}</span>
                                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 rounded uppercase mt-1">Vendor</span>
                            </div>
                        ))}
                        
                        <button onClick={() => setBrandUI({ isOpen: true, tab: "vendors", editingManualIdx: null })}
                            className="flex flex-col items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl h-[120px] text-gray-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                            <Plus size={20} />
                            <span className="text-xs font-bold">Add Brand</span>
                        </button>
                    </div>
                </div>
            );
        }

        case "faq":
            return (
                <div>
                    <TextField label="Section Title" value={cfg.title} onChange={v => set("title", v)} />
                    <TextField label="Subtitle" value={cfg.subtitle} onChange={v => set("subtitle", v)} />
                    <SectionDivider label="FAQ Items" />
                    {(cfg.faqs || []).map((faq, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl p-3 mb-3 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500">Q{i + 1}</span>
                                <button onClick={() => set("faqs", cfg.faqs.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                            </div>
                            <TextField label="Question" value={faq.q} onChange={v => set("faqs", cfg.faqs.map((f, idx) => idx === i ? { ...f, q: v } : f))} />
                            <TextField label="Answer" value={faq.a} onChange={v => set("faqs", cfg.faqs.map((f, idx) => idx === i ? { ...f, a: v } : f))} multiline />
                        </div>
                    ))}
                    <button onClick={() => set("faqs", [...(cfg.faqs || []), { q: "New Question?", a: "Answer here." }])}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-semibold text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-1">
                        <Plus size={13} /> Add FAQ
                    </button>
                </div>
            );

        case "custom_html":
            return (
                <div>
                    <TextField label="Block Label (for reference)" value={cfg.label} onChange={v => set("label", v)} />
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">HTML Code</label>
                        <textarea value={cfg.html || ""} onChange={e => set("html", e.target.value)} rows={8}
                            className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" />
                    </div>
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-xs text-yellow-700">
                        ⚠️ Only use trusted HTML. Scripts may not execute for security reasons.
                    </div>
                </div>
            );

        case "whatsapp_fab":
            return (
                <div>
                    <TextField label="Phone Number (include country code, e.g. +923001234567)" value={cfg.phoneNumber} onChange={v => set("phoneNumber", v)} />
                    <TextField label="Pre-filled Message" value={cfg.message} onChange={v => set("message", v)} multiline />
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Position</label>
                        <select value={cfg.position || "right"} onChange={e => set("position", e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none">
                            <option value="right">Bottom Right</option>
                            <option value="left">Bottom Left</option>
                        </select>
                    </div>
                </div>
            );

        case "spacer":
            return (
                <div>
                    <NumberField label="Height (px)" value={cfg.height} onChange={v => set("height", v)} min={8} max={200} />
                    <div className="mb-4 flex items-center gap-3">
                        <label className="text-xs font-semibold text-gray-600">Show Divider Line</label>
                        <button onClick={() => set("showDivider", !cfg.showDivider)}
                            className={`w-10 h-5 rounded-full transition-colors relative ${cfg.showDivider ? "bg-blue-500" : "bg-gray-200"}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${cfg.showDivider ? "left-5" : "left-0.5"}`} />
                        </button>
                    </div>
                    {cfg.showDivider && <ColorField label="Divider Color" value={cfg.dividerColor} onChange={v => set("dividerColor", v)} />}
                </div>
            );

        default:
            return (
                <div className="p-4 text-xs text-gray-400 text-center border border-dashed border-gray-200 rounded-xl">
                    No settings available for this section type.
                </div>
            );
    }
};

/* ─── Mini Preview Panel ─────────────────────────────────────────────── */
const MiniPreview = ({ section }) => {
    const cfg = section?.config || {};
    const meta = section ? SECTION_META[section.type] : null;

    if (!section) {
        return (
            <div className="h-full flex items-center justify-center text-center p-6">
                <div>
                    <div className="text-4xl mb-3">👆</div>
                    <p className="text-sm font-semibold text-gray-500">Select a section to see preview</p>
                    <p className="text-xs text-gray-400 mt-1">Click any section on the left</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${meta.color}`}>
                <span>{meta.icon}</span> {meta.label}
            </div>

            {section.type === "announcement_bar" && (
                <div className="rounded-xl p-3 text-center text-sm font-semibold text-white" style={{ backgroundColor: cfg.bgColor || "#1e4d28" }}>
                    {cfg.text || "Announcement text here"}
                    {cfg.linkText && <span className="ml-2 underline text-xs">{cfg.linkText}</span>}
                </div>
            )}

            {section.type === "trust_badges" && (
                <div className="grid grid-cols-2 gap-2">
                    {(cfg.badges || []).slice(0, 4).map((b, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-lg p-2.5 flex items-center gap-2 shadow-sm">
                            <div className="w-7 h-7 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                <Shield size={13} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-900 leading-none">{b.title}</p>
                                <p className="text-[9px] text-gray-400 mt-0.5 leading-none">{b.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {section.type === "stats_counter" && (
                <div className="grid grid-cols-2 gap-2">
                    {(cfg.stats || []).slice(0, 4).map((s, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-lg p-3 text-center shadow-sm">
                            <p className="text-base font-black text-primary">{s.value}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {section.type === "payment_strip" && (
                <div className="rounded-xl p-3" style={{ background: "linear-gradient(to right, #1A2E0E, #2C4E18)" }}>
                    <p className="text-xs font-bold text-white">{cfg.title}</p>
                    <p className="text-[10px] text-green-300 mt-0.5">{cfg.subtitle}</p>
                    <div className="mt-2 inline-block bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-lg">{cfg.ctaText}</div>
                </div>
            )}

            {section.type === "rx_upload_cta" && (
                <div className="rounded-xl p-4 text-white" style={{ backgroundColor: cfg.bgColor || "#1e4d28" }}>
                    <p className="text-sm font-bold">{cfg.title}</p>
                    <p className="text-[10px] mt-1 opacity-80">{cfg.subtitle}</p>
                    <div className="mt-3 inline-block bg-white text-primary-dark text-[10px] font-bold px-3 py-1.5 rounded-lg">{cfg.ctaText}</div>
                </div>
            )}

            {section.type === "announcement_bar" && null}
            {section.type === "top_micro_bar" && (
                <div className="rounded border overflow-hidden p-2 text-[10px] flex justify-between items-center" style={{ backgroundColor: cfg.bgColor || "#1e4d28", color: cfg.textColor || "#fff" }}>
                    <span>{cfg.textLeft}</span>
                    <span className="opacity-70">{cfg.phone}</span>
                </div>
            )}

            {section.type === "flash_sale" && (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white">
                    <p className="text-xs font-bold">{cfg.title}</p>
                    <div className="flex gap-2 mt-2">
                        {["02", "45", "30"].map((v, i) => (
                            <div key={i} className="text-center">
                                <div className="bg-white/20 rounded-lg px-2 py-1 text-base font-black">{v}</div>
                                <div className="text-[8px] mt-0.5 opacity-70">{["HRS", "MIN", "SEC"][i]}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {section.type === "testimonials" && (
                <div className="space-y-2">
                    {(cfg.testimonials || []).slice(0, 2).map((t, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
                            <div className="flex items-center gap-1 mb-1">
                                {[...Array(t.rating || 5)].map((_, j) => <Star key={j} size={9} className="text-amber-400 fill-amber-400" />)}
                            </div>
                            <p className="text-[10px] text-gray-600 italic">"{t.comment}"</p>
                            <p className="text-[9px] font-bold text-gray-400 mt-1">— {t.name}, {t.city}</p>
                        </div>
                    ))}
                </div>
            )}

            {section.type === "newsletter" && (
                <div className="rounded-xl p-4" style={{ backgroundColor: cfg.bgColor || "#ebf7d9" }}>
                    <p className="text-sm font-bold text-gray-900">{cfg.title}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{cfg.subtitle}</p>
                    <div className="flex gap-1.5 mt-3">
                        <div className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] text-gray-300">{cfg.placeholder}</div>
                        <div className="bg-primary text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg">{cfg.ctaText}</div>
                    </div>
                </div>
            )}

            {section.type === "faq" && (
                <div className="space-y-2">
                    {(cfg.faqs || []).slice(0, 3).map((faq, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm">
                            <div className="flex items-start justify-between gap-1">
                                <p className="text-[10px] font-bold text-gray-900">{faq.q}</p>
                                <ChevronDown size={10} className="text-gray-400 shrink-0 mt-0.5" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {section.type === "spacer" && (
                <div className="flex flex-col items-center justify-center" style={{ height: Math.min(cfg.height || 40, 80) }}>
                    {cfg.showDivider && <div className="w-full border-t" style={{ borderColor: cfg.dividerColor || "#E5E7EB" }} />}
                    <p className="text-[10px] text-gray-300 mt-1">{cfg.height || 40}px spacing</p>
                </div>
            )}

            {section.type === "brands" && (
                <div className="grid grid-cols-4 gap-1.5">
                    {(cfg.brands || []).slice(0, 7).map((b, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-lg p-2 text-center shadow-sm">
                            <div className="w-7 h-7 bg-green-50 text-green-700 rounded-lg flex items-center justify-center font-extrabold text-[9px] mx-auto mb-1">{b.abbr}</div>
                            <p className="text-[8px] text-gray-500 leading-tight">{b.name}</p>
                        </div>
                    ))}
                </div>
            )}

            {section.type === "custom_html" && (
                <div className="bg-gray-900 rounded-xl p-3 font-mono text-[10px] text-green-400 max-h-32 overflow-auto">
                    {cfg.html || "<!-- HTML code -->"}
                </div>
            )}

            {/* Generic preview for types without specific preview */}
            {["hero", "categories", "ribbon", "promo_banners", "mid_banners", "single_mid_banner", "conditions", "app_download", "blogs", "featured_category", "products_grid"].includes(section.type) && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <div className="text-2xl mb-2">{meta.icon}</div>
                    <p className="text-xs font-semibold text-gray-500">{meta.label}</p>
                    {cfg.title && <p className="text-[10px] text-gray-400 mt-1">"{cfg.title}"</p>}
                    <p className="text-[10px] text-gray-300 mt-3">Preview on live site →</p>
                </div>
            )}

            <div className={`text-center text-[10px] font-semibold py-1.5 px-3 rounded-full ${section.isVisible ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                {section.isVisible ? "✓ Visible on site" : "✗ Hidden from site"}
            </div>
        </div>
    );
};

/* ─── Add Section Modal ──────────────────────────────────────────────── */
const AddSectionModal = ({ onAdd, onClose, existingTypes }) => {
    const categories = ["Banner", "Content", "Utility"];
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div>
                        <h3 className="font-bold text-gray-900">Add New Section</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Choose a section type to add to your page</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
                </div>
                <div className="p-5">
                    {categories.map(cat => {
                        const types = ALL_SECTION_TYPES.filter(t => SECTION_META[t].category === cat);
                        return (
                            <div key={cat} className="mb-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{cat}</p>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {types.map(type => {
                                        const meta = SECTION_META[type];
                                        const canAdd = type === "products_grid" || type === "spacer" || type === "custom_html" || !existingTypes.includes(type);
                                        return (
                                            <button key={type} onClick={() => { onAdd(type); onClose(); }}
                                                disabled={!canAdd}
                                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center group ${canAdd ? "border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer" : "border-gray-100 opacity-40 cursor-not-allowed bg-gray-50"}`}>
                                                <span className="text-xl">{meta.icon}</span>
                                                <span className="text-[10px] font-semibold text-gray-600 group-hover:text-blue-600 transition-colors leading-tight">{meta.label}</span>
                                                {!canAdd && <span className="text-[8px] text-gray-300">Already added</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

/* ─── Main Builder Page ──────────────────────────────────────────────── */
const HomePageBuilderPage = () => {
    const navigate = useNavigate();
    const [sections, setSections] = useState([]);
    const [activeIdx, setActiveIdx] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Panel widths
    const [leftWidth, setLeftWidth] = useState(256);
    const [centerWidth, setCenterWidth] = useState(384);

    // Resizing refs
    const isResizingLeft = useRef(false);
    const isResizingCenter = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizingLeft.current) {
                // Min width 200, Max width 400
                setLeftWidth(Math.max(200, Math.min(e.clientX, 400)));
            } else if (isResizingCenter.current) {
                // Min width 300, Max width 800
                const newWidth = e.clientX - leftWidth;
                setCenterWidth(Math.max(300, Math.min(newWidth, 800)));
            }
        };
        const handleMouseUp = () => {
            if (isResizingLeft.current || isResizingCenter.current) {
                isResizingLeft.current = false;
                isResizingCenter.current = false;
                document.body.style.cursor = 'default';
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [leftWidth]);
    const [isDirty, setIsDirty] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [dragIdx, setDragIdx] = useState(null);
    const [dragOverIdx, setDragOverIdx] = useState(null);

    const { getHomePage } = useGetHomePage();
    const { updateHomePage, loading: saving } = useUpdateHomePage();
    const { resetHomePage, loading: resetting } = useResetHomePage();

    // Load config
    useEffect(() => {
        const load = async () => {
            setPageLoading(true);
            try {
                const res = await getHomePage({ forceRefresh: true });
                if (res?.sections) {
                    const sorted = [...res.sections].sort((a, b) => a.order - b.order);
                    setSections(sorted);
                }
            } catch {
                toast.error("Failed to load page config");
            } finally {
                setPageLoading(false);
            }
        };
        load();
    }, []);

    const updateSection = useCallback((idx, updated) => {
        setSections(prev => prev.map((s, i) => i === idx ? updated : s));
        setIsDirty(true);
    }, []);

    const toggleVisibility = (idx) => {
        setSections(prev => prev.map((s, i) => i === idx ? { ...s, isVisible: !s.isVisible } : s));
        setIsDirty(true);
    };

    const moveSection = (idx, dir) => {
        const next = idx + dir;
        if (next < 0 || next >= sections.length) return;
        const arr = [...sections];
        [arr[idx], arr[next]] = [arr[next], arr[idx]];
        const reordered = arr.map((s, i) => ({ ...s, order: i }));
        setSections(reordered);
        setActiveIdx(next);
        setIsDirty(true);
    };

    const removeSection = (idx) => {
        setSections(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })));
        setActiveIdx(null);
        setIsDirty(true);
    };

    const addSection = (type) => {
        const newSection = {
            type,
            isVisible: true,
            order: sections.length,
            config: SECTION_DEFAULTS[type]?.config || {},
        };
        setSections(prev => [...prev, newSection]);
        setActiveIdx(sections.length);
        setIsDirty(true);
    };

    const handleSave = async () => {
        try {
            const ordered = sections.map((s, i) => ({ ...s, order: i }));
            await updateHomePage(ordered);
            setIsDirty(false);
            toast.success("✅ Home page saved & published!");
        } catch {
            toast.error("Failed to save — please try again");
        }
    };

    const handleReset = async () => {
        if (!confirm("Reset to defaults? All custom settings will be lost.")) return;
        try {
            const res = await resetHomePage();
            if (res?.sections) {
                setSections([...res.sections].sort((a, b) => a.order - b.order));
                setActiveIdx(null);
                setIsDirty(false);
                toast.success("Reset to default settings");
            }
        } catch {
            toast.error("Reset failed");
        }
    };

    // Drag handlers
    const onDragStart = (idx) => setDragIdx(idx);
    const onDragOver = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
    const onDrop = (e, idx) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
        const arr = [...sections];
        const [moved] = arr.splice(dragIdx, 1);
        arr.splice(idx, 0, moved);
        const reordered = arr.map((s, i) => ({ ...s, order: i }));
        setSections(reordered);
        setActiveIdx(idx);
        setDragIdx(null);
        setDragOverIdx(null);
        setIsDirty(true);
    };
    const onDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

    const activeSection = activeIdx !== null ? sections[activeIdx] : null;
    const existingTypes = sections.map(s => s.type);

    // Scroll active section into view in the preview pane
    useEffect(() => {
        if (activeIdx !== null) {
            const el = document.getElementById(`preview-section-${activeIdx}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeIdx]);

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading Page Builder...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50 overflow-hidden">
            {/* ── Top Bar ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-200 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <LayoutTemplate size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 text-sm leading-none">Home Page Builder</h1>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            {sections.length} sections · {sections.filter(s => s.isVisible).length} visible
                            {isDirty && <span className="ml-2 text-amber-500 font-semibold">● Unsaved changes</span>}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate("/admin-dashboard")}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                        <X size={13} /> Close Builder
                    </button>
                    <button onClick={handleReset} disabled={resetting}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-500 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        <RotateCcw size={13} className={resetting ? "animate-spin" : ""} /> Reset
                    </button>
                    <button onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                        <Plus size={13} /> Add Section
                    </button>
                    <button onClick={handleSave} disabled={saving || !isDirty}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg transition-colors shadow-sm">
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {saving ? "Saving..." : "Save & Publish"}
                    </button>
                </div>
            </div>

            {/* ── 3-Column Layout ──────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT: Sections List */}
                <div 
                    style={{ width: leftWidth }}
                    className="bg-white flex flex-col overflow-hidden shrink-0">
                    <div className="px-3 py-2.5 border-b border-gray-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Page Sections</p>
                    </div>
                    <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
                        {sections.map((section, idx) => {
                            const meta = SECTION_META[section.type] || { label: section.type, icon: "📄", color: "bg-gray-100 text-gray-600" };
                            const isActive = activeIdx === idx;
                            const isDragging = dragIdx === idx;
                            const isDragOver = dragOverIdx === idx;
                            return (
                                <div key={idx}
                                    draggable
                                    onDragStart={() => onDragStart(idx)}
                                    onDragOver={e => onDragOver(e, idx)}
                                    onDrop={e => onDrop(e, idx)}
                                    onDragEnd={onDragEnd}
                                    onClick={() => setActiveIdx(isActive ? null : idx)}
                                    className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all select-none group
                                        ${isActive ? "bg-blue-50 border border-blue-100" : "hover:bg-gray-50 border border-transparent"}
                                        ${isDragging ? "opacity-40 scale-95" : ""}
                                        ${isDragOver && dragIdx !== idx ? "border-t-2 border-blue-400" : ""}`}>
                                    {/* Drag handle */}
                                    <div className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0">
                                        <GripVertical size={14} />
                                    </div>
                                    {/* Icon */}
                                    <span className="text-base leading-none shrink-0">{meta.icon}</span>
                                    {/* Label */}
                                    <span className={`text-xs font-semibold flex-1 truncate ${isActive ? "text-blue-700" : "text-gray-700"}`}>
                                        {meta.label}
                                    </span>
                                    {/* Visibility toggle */}
                                    <button
                                        onClick={e => { e.stopPropagation(); toggleVisibility(idx); }}
                                        className={`shrink-0 transition-colors ${section.isVisible ? "text-green-500 hover:text-gray-400" : "text-gray-300 hover:text-green-500"}`}
                                        title={section.isVisible ? "Hide section" : "Show section"}>
                                        {section.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                                    </button>
                                </div>
                            );
                        })}
                        {sections.length === 0 && (
                            <div className="text-center py-8 text-xs text-gray-400">
                                <p>No sections yet.</p>
                                <button onClick={() => setShowAddModal(true)} className="mt-2 text-blue-500 hover:text-blue-700 font-semibold">+ Add First Section</button>
                            </div>
                        )}
                    </div>
                    <div className="p-2 border-t border-gray-100">
                        <button onClick={() => setShowAddModal(true)}
                            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-semibold text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-1">
                            <Plus size={13} /> Add Section
                        </button>
                    </div>
                </div>

                {/* Left Resizer */}
                <div 
                    className="w-1.5 hover:w-2 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors shrink-0 z-10 flex items-center justify-center relative -mx-[1px]"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        isResizingLeft.current = true;
                        document.body.style.cursor = 'col-resize';
                    }}
                >
                    <div className="w-0.5 h-8 bg-gray-400 rounded-full" />
                </div>

                {/* CENTER: Edit Form */}
                <div 
                    style={{ width: centerWidth }}
                    className="flex flex-col bg-white overflow-hidden shrink-0">
                    {activeSection ? (
                        <>
                            {/* Form header */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${SECTION_META[activeSection.type]?.color || "bg-gray-100 text-gray-600"}`}>
                                        {SECTION_META[activeSection.type]?.icon} {SECTION_META[activeSection.type]?.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => moveSection(activeIdx, -1)} disabled={activeIdx === 0} title="Move Up"
                                        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-30 transition-colors">
                                        <ArrowUp size={13} />
                                    </button>
                                    <button onClick={() => moveSection(activeIdx, 1)} disabled={activeIdx === sections.length - 1} title="Move Down"
                                        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-30 transition-colors">
                                        <ArrowDown size={13} />
                                    </button>
                                    <button onClick={() => toggleVisibility(activeIdx)}
                                        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${activeSection.isVisible ? "border-green-200 bg-green-50 text-green-600 hover:bg-green-100" : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                                        {activeSection.isVisible ? <><Eye size={12} /> Visible</> : <><EyeOff size={12} /> Hidden</>}
                                    </button>
                                    <button onClick={() => removeSection(activeIdx)}
                                        className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 px-2.5 py-1.5 rounded-lg transition-colors">
                                        <Trash2 size={12} /> Remove
                                    </button>
                                </div>
                            </div>
                            {/* Form body */}
                            <div className="flex-1 overflow-y-auto p-5">
                                <EditForm section={activeSection} onChange={updated => updateSection(activeIdx, updated)} />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Settings2 size={28} className="text-blue-400" />
                                </div>
                                <h3 className="font-semibold text-gray-700 mb-1">Select a Section to Edit</h3>
                                <p className="text-sm text-gray-400 max-w-xs">Click any section on the left panel to edit its content and settings</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Center Resizer */}
                <div 
                    className="w-1.5 hover:w-2 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors shrink-0 z-10 flex items-center justify-center relative -mx-[1px]"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        isResizingCenter.current = true;
                        document.body.style.cursor = 'col-resize';
                    }}
                >
                    <div className="w-0.5 h-8 bg-gray-400 rounded-full" />
                </div>

                {/* RIGHT: Live Preview */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 relative">
                    <div className="px-4 py-2.5 border-b border-gray-200 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
                        <div className="flex items-center gap-2">
                            <Eye size={14} className="text-blue-500" />
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">Live Preview</p>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">Updates instantly as you edit</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <div className="w-full bg-white min-h-full pb-32">
                            <HomePage previewSections={sections} activePreviewIdx={activeIdx} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Section Modal */}
            {showAddModal && (
                <AddSectionModal
                    onAdd={addSection}
                    onClose={() => setShowAddModal(false)}
                    existingTypes={existingTypes}
                />
            )}
        </div>
    );
};

export default HomePageBuilderPage;
