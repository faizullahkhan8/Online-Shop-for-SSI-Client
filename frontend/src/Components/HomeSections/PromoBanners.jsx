import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getImageUrl, handleImageError } from "../../utils/imageHelper";

const PromoBanners = ({ config }) => {
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(config.banners || []).map((b, i) => (
                    <div key={i}
                        className="relative rounded-3xl overflow-hidden p-6 sm:p-8 group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 min-h-[200px] flex items-center"
                        style={{
                            background: b.image
                                ? undefined
                                : `linear-gradient(to bottom right, ${b.bgFrom || "#F0F9E6"}, ${b.bgTo || "#DCF0C4"})`,
                            border: b.image ? "none" : `1px solid ${b.borderColor || "#C8E2AC"}`,
                        }}
                    >
                        {/* Background gradient (always present under image) */}
                        {!b.image && (
                            <div className="absolute right-0 top-0 w-32 h-32 rounded-full -mr-8 -mt-8 blur-xl transition-transform duration-500 group-hover:scale-125"
                                style={{ background: `${b.badgeColor || "#4d8d3a"}30` }}
                            />
                        )}

                        {/* Banner image + overlay */}
                        {b.image && (
                            <>
                                <img
                                    src={getImageUrl(b.image, "banner")}
                                    alt={b.title}
                                    onError={(e) => handleImageError(e, "banner")}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Dark gradient overlay so text stays readable */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
                            </>
                        )}

                        {/* Content */}
                        <div className="relative z-10 w-full sm:w-2/3">
                            <span
                                className="inline-block text-[10px] font-black uppercase tracking-[0.15em] text-white px-3 py-1 rounded-full mb-4 shadow-sm"
                                style={{ background: b.badgeColor || "#4d8d3a" }}
                            >
                                {b.badge}
                            </span>
                            <h3 className={`text-xl sm:text-2xl font-black mb-2 leading-tight ${b.image ? "text-white" : "text-gray-900"}`}>
                                {(b.title || "").split("\n").map((line, li, arr) => (
                                    <span key={li}>{line}{li < arr.length - 1 && <br />}</span>
                                ))}
                            </h3>
                            <p className={`text-sm font-bold leading-relaxed mb-6 max-w-xs ${b.image ? "text-white/85" : "text-gray-600"}`}>
                                {b.desc}
                            </p>
                            <Link
                                to={b.ctaLink || "/products"}
                                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest group-hover:gap-2.5 transition-all"
                                style={{ color: b.image ? "#fff" : (b.ctaColor || "#1e4d28") }}
                            >
                                {b.ctaText} <ArrowRight size={14} strokeWidth={3} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default PromoBanners;

