import * as Icons from "lucide-react";
import { Link } from "react-router-dom";
import { useGetHomePage } from "../../api/hooks/homePage.api";

const FooterLink = ({ to, children }) => (
    <li>
        <Link
            to={to || "#"}
            className="flex items-center gap-2 text-gray-400 hover:text-primary text-xs font-bold transition-colors group"
        >
            <Icons.ChevronRight size={12} className="opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all shrink-0 text-primary" />
            {children}
        </Link>
    </li>
);

const ColHeading = ({ children }) => (
    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-5">
        {children}
    </h4>
);

const DynamicIcon = ({ name, ...props }) => {
    const IconComponent = Icons[name] || Icons.HelpCircle;
    return <IconComponent {...props} />;
};

const Footer = ({ previewSections }) => {
    const { data } = useGetHomePage();
    const sections = previewSections || data?.sections || [];
    const footerSection = sections.find(s => s.type === "footer");
    
    if (footerSection && footerSection.isVisible === false) {
        return null;
    }

    const config = footerSection?.config || {
        copyright: "© " + new Date().getFullYear() + " Zada Online Pharmacy. All Rights Reserved.",
        categoriesLinks: [
            { name: "Medicines", path: "/products?category=Medicines" },
            { name: "Baby & Mother Care", path: "/products?category=Baby" },
            { name: "Nutrition & Supplements", path: "/products?category=Nutrition" },
            { name: "Personal Care", path: "/products?category=Personal" }
        ],
        quickLinks: [
            { name: "About Us", path: "/about-us" },
            { name: "Health Blogs", path: "/" },
            { name: "Careers", path: "/about-us" },
            { name: "Feedback", path: "/contact-us" }
        ],
        supportLinks: [
            { name: "FAQs", path: "/contact-us" },
            { name: "Return & Refund Policy", path: "/about-us" },
            { name: "Shipping Policy", path: "/about-us" },
            { name: "Terms & Conditions", path: "/about-us" },
            { name: "Privacy Policy", path: "/about-us" }
        ],
        socialLinks: [
            { platform: "Facebook", url: "#", color: "hover:bg-[#1877F2]" },
            { platform: "Instagram", url: "#", color: "hover:bg-[#E1306C]" },
            { platform: "Twitter", url: "#", color: "hover:bg-[#1DA1F2]" }
        ],
        trustBadges: [
            { icon: "Truck", title: "Free Delivery", desc: "Orders above Rs 999" },
            { icon: "Clock", title: "2-Hour Express", desc: "Major cities" },
            { icon: "RotateCcw", title: "Easy Returns", desc: "7-day policy" },
            { icon: "ShieldCheck", title: "100% Genuine", desc: "Licensed pharmacy" }
        ],
        contact: { phone: "(021) 111-633-422", email: "support@zada.pk", address: "Main Commercial Area, Karachi & Lahore, Pakistan" }
    };

    return (
        <footer className="w-full bg-gray-950 text-white mt-14">

            {/* ── Trust Badges Strip ──────────────────────────────── */}
            <div className="bg-gray-900 border-b border-gray-800">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                        {(config.trustBadges || []).map((badge, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-inner">
                                    <DynamicIcon name={badge.icon} size={18} />
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

                    {/* Brand Column — spans 6 cols since we removed Newsletter (which was 2 cols and brand was 4) => Let's make Brand 3 cols, and the 3 link lists 3 cols each */}
                    <div className="lg:col-span-3 space-y-6">
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
                            <a href={`tel:${config.contact?.phone || ''}`} className="flex items-center gap-3 hover:text-primary transition-colors group">
                                <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                    <Icons.PhoneCall size={14} className="text-gray-400 group-hover:text-primary transition-colors" />
                                </div>
                                {config.contact?.phone}
                            </a>
                            <a href={`mailto:${config.contact?.email || ''}`} className="flex items-center gap-3 hover:text-primary transition-colors group">
                                <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                    <Icons.Mail size={14} className="text-gray-400 group-hover:text-primary transition-colors" />
                                </div>
                                {config.contact?.email}
                            </a>
                            <div className="flex items-start gap-3 text-gray-400">
                                <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                                    <Icons.MapPin size={14} className="text-gray-500" />
                                </div>
                                <span className="pt-1">{config.contact?.address}</span>
                            </div>
                        </div>

                        {/* Social Icons */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Follow Us</p>
                            <div className="flex flex-wrap gap-2.5">
                                {(config.socialLinks || []).map((s, i) => {
                                    // Map common names to lucide icons or fallback
                                    let iconName = "Link";
                                    const p = s.platform?.toLowerCase() || "";
                                    if(p.includes("facebook")) iconName = "Facebook";
                                    if(p.includes("instagram")) iconName = "Instagram";
                                    if(p.includes("twitter") || p.includes("x")) iconName = "Twitter";
                                    if(p.includes("youtube")) iconName = "Youtube";
                                    if(p.includes("linkedin")) iconName = "Linkedin";

                                    return (
                                        <a
                                            key={i}
                                            href={s.url}
                                            aria-label={s.platform}
                                            className={`w-9 h-9 rounded-xl bg-gray-800 text-gray-400 flex items-center justify-center transition-all duration-300 hover:text-white hover:scale-110 shadow-sm ${s.color}`}
                                        >
                                            <DynamicIcon name={iconName} size={15} />
                                        </a>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Categories — spans 3 cols */}
                    <div className="lg:col-span-3 lg:pl-8">
                        <ColHeading>{config.categoriesLinksTitle || "Categories"}</ColHeading>
                        <ul className="space-y-3">
                            {(config.categoriesLinks || []).map((link, i) => (
                                <FooterLink key={i} to={link.path}>{link.name}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Links — spans 3 cols */}
                    <div className="lg:col-span-3">
                        <ColHeading>{config.quickLinksTitle || "Quick Links"}</ColHeading>
                        <ul className="space-y-3">
                            {(config.quickLinks || []).map((link, i) => (
                                <FooterLink key={i} to={link.path}>{link.name}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Support — spans 3 cols */}
                    <div className="lg:col-span-3">
                        <ColHeading>{config.supportLinksTitle || "Support"}</ColHeading>
                        <ul className="space-y-3">
                            {(config.supportLinks || []).map((link, i) => (
                                <FooterLink key={i} to={link.path}>{link.name}</FooterLink>
                            ))}
                        </ul>
                        
                        {/* Trust badge replacing the newsletter trust badge */}
                        <div className="mt-8 p-4 rounded-2xl bg-gray-900 border border-gray-800 flex items-start gap-3">
                            <Icons.HeartPulse size={20} className="text-primary shrink-0 mt-0.5" />
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
                        {config.copyright || "© " + new Date().getFullYear() + " Zada Online Pharmacy. All Rights Reserved."}
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
