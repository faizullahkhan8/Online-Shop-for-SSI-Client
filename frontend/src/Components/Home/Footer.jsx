import {
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    Youtube,
    PhoneCall,
    Mail,
    MapPin,
    ShieldCheck,
    Truck,
    Clock,
    RotateCcw,
    HeartPulse,
    ArrowRight,
    ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

/* ─── Data ─────────────────────────────────────────────────── */
const categoriesLinks = [
    { name: "Medicines", path: "/products?category=Medicines" },
    { name: "Baby & Mother Care", path: "/products?category=Baby" },
    { name: "Nutrition & Supplements", path: "/products?category=Nutrition" },
    { name: "Personal Care", path: "/products?category=Personal" },
    { name: "Foods & Beverages", path: "/products?category=Beverages" },
    { name: "Devices & Appliances", path: "/products?category=Devices" },
    { name: "OTC & Health Needs", path: "/products?category=OTC" },
];

const quickLinks = [
    { name: "About Us", path: "/about-us" },
    { name: "Health Blogs", path: "/" },
    { name: "Careers", path: "/about-us" },
    { name: "Find a Store", path: "/contact-us" },
    { name: "Feedback", path: "/contact-us" },
];

const supportLinks = [
    { name: "FAQs", path: "/contact-us" },
    { name: "Return & Refund Policy", path: "/about-us" },
    { name: "Shipping Policy", path: "/about-us" },
    { name: "Terms & Conditions", path: "/about-us" },
    { name: "Privacy Policy", path: "/about-us" },
    { name: "Contact Support", path: "/contact-us" },
];

const socialLinks = [
    { icon: <Facebook size={15} />, label: "Facebook", href: "#", color: "hover:bg-[#1877F2]" },
    { icon: <Instagram size={15} />, label: "Instagram", href: "#", color: "hover:bg-[#E1306C]" },
    { icon: <Twitter size={15} />, label: "Twitter / X", href: "#", color: "hover:bg-[#1DA1F2]" },
    { icon: <Linkedin size={15} />, label: "LinkedIn", href: "#", color: "hover:bg-[#0A66C2]" },
    { icon: <Youtube size={15} />, label: "YouTube", href: "#", color: "hover:bg-[#FF0000]" },
];

const trustBadges = [
    { icon: <Truck size={18} />, title: "Free Delivery", desc: "Orders above Rs 999" },
    { icon: <Clock size={18} />, title: "2-Hour Express", desc: "Major cities" },
    { icon: <RotateCcw size={18} />, title: "Easy Returns", desc: "7-day policy" },
    { icon: <ShieldCheck size={18} />, title: "100% Genuine", desc: "Licensed pharmacy" },
];

/* ─── Footer Link Item ──────────────────────────────────────── */
const FooterLink = ({ to, children }) => (
    <li>
        <Link
            to={to}
            className="flex items-center gap-2 text-gray-400 hover:text-primary text-xs font-bold transition-colors group"
        >
            <ChevronRight size={12} className="opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all shrink-0 text-primary" />
            {children}
        </Link>
    </li>
);

/* ─── Column Heading ─────────────────────────────────────────── */
const ColHeading = ({ children }) => (
    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-5">
        {children}
    </h4>
);

/* ─── Footer Component ──────────────────────────────────────── */
const Footer = () => {
    return (
        <footer className="w-full bg-gray-950 text-white mt-14">

            {/* ── Trust Badges Strip ──────────────────────────────── */}
            <div className="bg-gray-900 border-b border-gray-800">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                        {trustBadges.map((badge, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-inner">
                                    {badge.icon}
                                </div>
                                <div>
                                    <p className="text-[12px] font-black text-white leading-tight uppercase tracking-wider">{badge.title}</p>
                                    <p className="text-[11px] font-bold text-gray-400 mt-0.5">{badge.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Main Footer Grid ─────────────────────────────────── */}
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-16 pb-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">

                    {/* Brand Column — spans 4 cols */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Logo */}
                        <Link to="/" className="inline-flex items-center justify-center group mb-2 bg-white px-5 py-2.5 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                            <img 
                                src="/assets/images/zada-logo.webp" 
                                alt="Zada Pharmacy" 
                                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105" 
                            />
                        </Link>

                        {/* Description */}
                        <p className="text-xs font-bold text-gray-400 leading-relaxed max-w-sm">
                            Pakistan's most trusted licensed online pharmacy. Delivering authentic medicines with 2-hour doorstep service across major cities.
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-3.5 text-xs font-bold text-gray-300">
                            <a href="tel:021111633422" className="flex items-center gap-3 hover:text-primary transition-colors group">
                                <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                    <PhoneCall size={14} className="text-gray-400 group-hover:text-primary transition-colors" />
                                </div>
                                (021) 111-633-422
                            </a>
                            <a href="mailto:support@zada.pk" className="flex items-center gap-3 hover:text-primary transition-colors group">
                                <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                    <Mail size={14} className="text-gray-400 group-hover:text-primary transition-colors" />
                                </div>
                                support@zada.pk
                            </a>
                            <div className="flex items-start gap-3 text-gray-400">
                                <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                                    <MapPin size={14} className="text-gray-500" />
                                </div>
                                <span className="pt-1">Main Commercial Area, Karachi & Lahore, Pakistan</span>
                            </div>
                        </div>

                        {/* Social Icons */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Follow Us</p>
                            <div className="flex gap-2.5">
                                {socialLinks.map((s, i) => (
                                    <a
                                        key={i}
                                        href={s.href}
                                        aria-label={s.label}
                                        className={`w-9 h-9 rounded-xl bg-gray-800 text-gray-400 flex items-center justify-center transition-all duration-300 hover:text-white hover:scale-110 shadow-sm ${s.color}`}
                                    >
                                        {s.icon}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Categories — spans 2 cols */}
                    <div className="lg:col-span-2">
                        <ColHeading>Categories</ColHeading>
                        <ul className="space-y-3">
                            {categoriesLinks.map((link, i) => (
                                <FooterLink key={i} to={link.path}>{link.name}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Links — spans 2 cols */}
                    <div className="lg:col-span-2">
                        <ColHeading>Quick Links</ColHeading>
                        <ul className="space-y-3">
                            {quickLinks.map((link, i) => (
                                <FooterLink key={i} to={link.path}>{link.name}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Support — spans 2 cols */}
                    <div className="lg:col-span-2">
                        <ColHeading>Support</ColHeading>
                        <ul className="space-y-3">
                            {supportLinks.map((link, i) => (
                                <FooterLink key={i} to={link.path}>{link.name}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter — spans 2 cols */}
                    <div className="lg:col-span-2">
                        <ColHeading>Newsletter</ColHeading>
                        <p className="text-xs font-bold text-gray-400 mb-5 leading-relaxed">
                            Get weekly health tips, new arrivals & exclusive deals in your inbox.
                        </p>
                        <form className="flex flex-col gap-2.5" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Your email address"
                                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder:text-gray-600 outline-none focus:border-primary focus:bg-gray-800 transition-all shadow-inner"
                            />
                            <button
                                type="submit"
                                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-[11px] font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                            >
                                Subscribe <ArrowRight size={14} strokeWidth={3} />
                            </button>
                        </form>

                        {/* Trust badge */}
                        <div className="mt-6 p-4 rounded-2xl bg-gray-900 border border-gray-800 flex items-start gap-3">
                            <HeartPulse size={20} className="text-primary shrink-0 mt-0.5" />
                            <div className="text-xs leading-snug">
                                <span className="font-black text-white block mb-1 uppercase tracking-wider">Licensed</span>
                                <span className="font-bold text-gray-500">Registered with DRAP, Pakistan</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom Bar ───────────────────────────────────────── */}
            <div className="border-t border-gray-800 bg-black/40">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[11px] font-bold text-gray-500 text-center md:text-left tracking-wide">
                        © {new Date().getFullYear()} Zada Online Pharmacy. All Rights Reserved.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        <Link to="/about-us" className="hover:text-primary transition-colors">Privacy</Link>
                        <span className="text-gray-700">·</span>
                        <Link to="/about-us" className="hover:text-primary transition-colors">Terms</Link>
                        <span className="text-gray-700">·</span>
                        <Link to="/about-us" className="hover:text-primary transition-colors">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;