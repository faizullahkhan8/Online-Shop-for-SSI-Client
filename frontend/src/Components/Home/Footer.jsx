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
            className="flex items-center gap-1.5 text-[#A6D76E]/80 hover:text-[#A6D76E] text-[12px] font-medium transition-colors group"
        >
            <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            {children}
        </Link>
    </li>
);

/* ─── Column Heading ─────────────────────────────────────────── */
const ColHeading = ({ children }) => (
    <h4 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#74AA34] mb-4">
        {children}
    </h4>
);

/* ─── Footer Component ──────────────────────────────────────── */
const Footer = () => {
    return (
        <footer className="w-full bg-[#1A3A1E] text-white">

            {/* ── Trust Badges Strip ──────────────────────────────── */}
            <div className="bg-[#1E5128] border-b border-white/10">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                        {trustBadges.map((badge, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#74AA34]/20 border border-[#74AA34]/30 flex items-center justify-center text-[#74AA34] shrink-0">
                                    {badge.icon}
                                </div>
                                <div>
                                    <p className="text-[12px] font-bold text-white leading-tight">{badge.title}</p>
                                    <p className="text-[11px] text-[#A6D76E]/70 mt-0.5">{badge.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Main Footer Grid ─────────────────────────────────── */}
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-12 pb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">

                    {/* Brand Column — spans 4 cols */}
                    <div className="lg:col-span-4 space-y-5">
                        {/* Logo */}
                        <Link to="/" className="inline-flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#74AA34] rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md">
                                M+
                            </div>
                            <div>
                                <span className="font-extrabold text-xl text-white tracking-tight leading-tight block">
                                    Medi<span className="text-[#74AA34]">Care</span>
                                </span>
                                <span className="text-[10px] font-semibold text-[#A6D76E]/70 uppercase tracking-[0.14em]">
                                    Pharmacy &amp; Wellness
                                </span>
                            </div>
                        </Link>

                        {/* Description */}
                        <p className="text-[12.5px] text-[#A6D76E]/70 leading-relaxed max-w-xs">
                            Pakistan's most trusted licensed online pharmacy. Delivering authentic medicines with 2-hour doorstep service across major cities.
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-2.5 text-[12px]">
                            <a href="tel:021111633422" className="flex items-center gap-2.5 text-[#A6D76E]/80 hover:text-[#74AA34] transition-colors font-medium">
                                <div className="w-7 h-7 rounded-lg bg-[#74AA34]/15 flex items-center justify-center shrink-0">
                                    <PhoneCall size={13} className="text-[#74AA34]" />
                                </div>
                                (021) 111-633-422
                            </a>
                            <a href="mailto:support@medicare.pk" className="flex items-center gap-2.5 text-[#A6D76E]/80 hover:text-[#74AA34] transition-colors font-medium">
                                <div className="w-7 h-7 rounded-lg bg-[#74AA34]/15 flex items-center justify-center shrink-0">
                                    <Mail size={13} className="text-[#74AA34]" />
                                </div>
                                support@medicare.pk
                            </a>
                            <div className="flex items-start gap-2.5 text-[#A6D76E]/70">
                                <div className="w-7 h-7 rounded-lg bg-[#74AA34]/15 flex items-center justify-center shrink-0 mt-0.5">
                                    <MapPin size={13} className="text-[#74AA34]" />
                                </div>
                                <span>Main Commercial Area, Karachi &amp; Lahore, Pakistan</span>
                            </div>
                        </div>

                        {/* Social Icons */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A6D76E]/50 mb-2.5">Follow Us</p>
                            <div className="flex gap-2">
                                {socialLinks.map((s, i) => (
                                    <a
                                        key={i}
                                        href={s.href}
                                        aria-label={s.label}
                                        className={`w-8 h-8 rounded-lg bg-white/10 text-[#A6D76E] flex items-center justify-center transition-all duration-200 hover:text-white hover:scale-110 ${s.color}`}
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
                        <ul className="space-y-2">
                            {categoriesLinks.map((link, i) => (
                                <FooterLink key={i} to={link.path}>{link.name}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Links — spans 2 cols */}
                    <div className="lg:col-span-2">
                        <ColHeading>Quick Links</ColHeading>
                        <ul className="space-y-2">
                            {quickLinks.map((link, i) => (
                                <FooterLink key={i} to={link.path}>{link.name}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Support — spans 2 cols */}
                    <div className="lg:col-span-2">
                        <ColHeading>Support</ColHeading>
                        <ul className="space-y-2">
                            {supportLinks.map((link, i) => (
                                <FooterLink key={i} to={link.path}>{link.name}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter — spans 2 cols */}
                    <div className="lg:col-span-2">
                        <ColHeading>Health Newsletter</ColHeading>
                        <p className="text-[12px] text-[#A6D76E]/70 mb-4 leading-relaxed">
                            Get weekly health tips, new arrivals &amp; exclusive deals in your inbox.
                        </p>
                        <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Your email address"
                                className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-[#A6D76E]/40 outline-none focus:border-[#74AA34] focus:bg-white/15 transition-all"
                            />
                            <button
                                type="submit"
                                className="flex items-center justify-center gap-1.5 bg-[#74AA34] hover:bg-[#629329] text-white text-[11px] font-extrabold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                Subscribe <ArrowRight size={12} />
                            </button>
                        </form>

                        {/* Trust badge */}
                        <div className="mt-5 p-3 rounded-xl bg-[#74AA34]/15 border border-[#74AA34]/25 flex items-center gap-2.5">
                            <HeartPulse size={18} className="text-[#74AA34] shrink-0" />
                            <div className="text-[11px] leading-snug">
                                <span className="font-bold text-white block">Licensed Pharmacy</span>
                                <span className="text-[#A6D76E]/70">Registered with DRAP, Pakistan</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom Bar ───────────────────────────────────────── */}
            <div className="border-t border-white/10 bg-black/20">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-[#A6D76E]/50 text-center sm:text-left">
                        © 2026 MediCare Online Pharmacy. All Rights Reserved.
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[#A6D76E]/50">
                        <Link to="/about-us" className="hover:text-[#A6D76E] transition-colors">Privacy</Link>
                        <span className="text-white/20">·</span>
                        <Link to="/about-us" className="hover:text-[#A6D76E] transition-colors">Terms</Link>
                        <span className="text-white/20">·</span>
                        <Link to="/about-us" className="hover:text-[#A6D76E] transition-colors">Cookies</Link>
                        <span className="text-white/20">·</span>
                        <span className="text-[#A6D76E]/40">
                            Disclaimer: Fulfilled by certified pharmacist partners.
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;