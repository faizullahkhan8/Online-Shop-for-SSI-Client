import {
    ArrowUpRight, Clock, Facebook, HeartPulse, HelpCircle, Instagram,
    Linkedin, Link as LinkIcon, Mail, MapPin, PhoneCall, RotateCcw,
    ShieldCheck, Truck, Twitter, Youtube,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useGetHomePage } from "../../api/hooks/homePage.api";

const ICON_MAP = { Truck, Clock, RotateCcw, ShieldCheck, HelpCircle, Facebook, Instagram, Twitter, Youtube, Linkedin, Link: LinkIcon };

const DynamicIcon = ({ name, ...props }) => {
    const IconComponent = ICON_MAP[name] || ShieldCheck;
    return <IconComponent {...props} />;
};

const FooterLink = ({ to, children }) => (
    <li>
        <Link to={to || "/"} className="group inline-flex items-center gap-2 text-sm font-medium text-white/62 transition-colors hover:text-[#cbea9d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9fca69]/35 transition-all group-hover:bg-[#bce384] group-hover:shadow-[0_0_0_4px_rgba(188,227,132,0.1)]" />
            {children}
        </Link>
    </li>
);

const ColumnHeading = ({ children }) => (
    <h3 className="mb-5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#bce384]">{children}</h3>
);

const Footer = ({ previewSections }) => {
    const { data } = useGetHomePage();
    const sections = previewSections || data?.sections || [];
    const footerSection = sections.find((section) => section.type === "footer");

    if (!footerSection || footerSection.isVisible === false) return null;

    const config = footerSection.config || {};
    const contact = config.contact || {};
    const phoneHref = contact.phone?.replace(/[^+\d]/g, "") || "";

    return (
        <footer className="mt-16 w-full overflow-hidden bg-[#102b1a] text-white">
            {(config.trustBadges || []).length > 0 && (
                <div className="border-b border-white/10 bg-[#173923]">
                    <div className="site-shell grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                        {(config.trustBadges || []).map((badge, index) => (
                            <div key={`${badge.title}-${index}`} className="flex min-h-24 items-center gap-4 px-1 py-5 sm:px-5 lg:px-6 first:pl-0 last:pr-0">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#bce384]/25 bg-[#bce384]/10 text-[#cbea9d]">
                                    <DynamicIcon name={badge.icon} size={20} strokeWidth={1.8} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold leading-snug text-white">{badge.title}</p>
                                    <p className="mt-1 text-xs leading-snug text-white/48">{badge.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="site-shell py-12 sm:py-14 lg:py-16">
                <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-12 lg:gap-x-10">
                    <div className="col-span-2 md:col-span-5 lg:col-span-4">
                        <Link to="/" aria-label="Zada Pharmacy home" className="inline-flex rounded-2xl bg-white px-5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.16)] transition-transform hover:-translate-y-0.5">
                            <img src="/assets/images/zada-logo.webp" alt="Zada Pharmacy" className="h-11 w-auto object-contain sm:h-12" />
                        </Link>
                        {config.description && <p className="mt-6 max-w-md text-sm leading-6 text-white/58">{config.description}</p>}
                        <Link to="/upload-prescription" className="mt-6 inline-flex items-center gap-3 rounded-xl border border-[#bce384]/20 bg-[#bce384]/10 px-4 py-3 text-sm font-bold text-[#d9f3b5] transition-colors hover:bg-[#bce384]/16">
                            <HeartPulse size={18} /> Upload Prescription <ArrowUpRight size={15} className="ml-1" />
                        </Link>

                        {(config.socialLinks || []).length > 0 && (
                            <div className="mt-7 flex flex-wrap gap-2.5">
                                {(config.socialLinks || []).map((social, index) => {
                                    const platform = social.platform?.toLowerCase() || "";
                                    let iconName = "Link";
                                    if (platform.includes("facebook")) iconName = "Facebook";
                                    if (platform.includes("instagram")) iconName = "Instagram";
                                    if (platform.includes("twitter") || platform === "x") iconName = "Twitter";
                                    if (platform.includes("youtube")) iconName = "Youtube";
                                    if (platform.includes("linkedin")) iconName = "Linkedin";
                                    const isExternal = social.url?.startsWith("http");
                                    return (
                                        <a key={`${social.platform}-${index}`} href={social.url || "#"} aria-label={social.platform} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined} className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/60 transition-all hover:-translate-y-0.5 hover:text-white ${social.color || ""}`}>
                                            <DynamicIcon name={iconName} size={17} />
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <ColumnHeading>{config.categoriesLinksTitle || "Shop"}</ColumnHeading>
                        <ul className="space-y-3.5">{(config.categoriesLinks || []).map((link, index) => <FooterLink key={`${link.path}-${index}`} to={link.path}>{link.name}</FooterLink>)}</ul>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <ColumnHeading>{config.quickLinksTitle || "Company"}</ColumnHeading>
                        <ul className="space-y-3.5">{(config.quickLinks || []).map((link, index) => <FooterLink key={`${link.path}-${index}`} to={link.path}>{link.name}</FooterLink>)}</ul>
                    </div>
                    <div className="col-span-2 md:col-span-3 lg:col-span-4 lg:pl-4">
                        <ColumnHeading>{config.supportLinksTitle || "Help & Account"}</ColumnHeading>
                        <ul className="grid grid-cols-2 gap-x-6 gap-y-3.5 sm:grid-cols-1">
                            {(config.supportLinks || []).map((link, index) => <FooterLink key={`${link.path}-${index}`} to={link.path}>{link.name}</FooterLink>)}
                        </ul>

                        <div className="mt-7 space-y-3 border-t border-white/10 pt-6">
                            {contact.phone && <a href={`tel:${phoneHref}`} className="flex items-center gap-3 text-sm text-white/62 hover:text-[#cbea9d]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#bce384]"><PhoneCall size={16} /></span>{contact.phone}</a>}
                            {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-sm text-white/62 hover:text-[#cbea9d]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#bce384]"><Mail size={16} /></span><span className="break-all">{contact.email}</span></a>}
                            {contact.address && <div className="flex items-start gap-3 text-sm leading-5 text-white/50"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#bce384]"><MapPin size={16} /></span><span className="pt-2">{contact.address}</span></div>}
                        </div>
                    </div>
                </div>

                {config.licenseTitle && (
                    <div className="mt-12 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3"><ShieldCheck size={21} className="shrink-0 text-[#bce384]" /><p className="text-sm font-bold text-white">{config.licenseTitle}</p></div>
                        {config.licenseText && <p className="text-xs leading-5 text-white/48 sm:text-right">{config.licenseText}</p>}
                    </div>
                )}
            </div>

            <div className="border-t border-white/10 bg-[#0b2113]">
                <div className="site-shell flex flex-col items-center justify-between gap-4 py-5 sm:flex-row">
                    <p className="text-center text-xs text-white/42 sm:text-left">{config.copyright}</p>
                    {(config.policyLinks || []).length > 0 && <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-white/48">{(config.policyLinks || []).map((link, index) => <Link key={`${link.path}-${index}`} to={link.path || "/"} className="transition-colors hover:text-[#cbea9d]">{link.name}</Link>)}</div>}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
