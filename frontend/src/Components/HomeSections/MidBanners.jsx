import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getImageUrl, handleImageError } from "../../utils/imageHelper";

const MidBanners = ({ config }) => {
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(config.banners || []).map((b, i) => (
                    <div key={i} className="relative rounded-3xl text-white overflow-hidden p-6 sm:p-8 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[220px] flex items-center"
                        style={{ background: `linear-gradient(to bottom right, ${b.bgFrom}, ${b.bgTo})` }}>
                        
                        {/* Background Shapes */}
                        <div className="absolute right-0 bottom-0 w-48 h-48 rounded-full bg-white/10 -mr-12 -mb-12 blur-2xl transition-transform duration-500 group-hover:scale-125" />
                        
                        {/* Banner Image (if provided) */}
                        {b.image && (
                            <>
                                <img 
                                    src={getImageUrl(b.image, 'banner')} 
                                    alt={b.title} 
                                    onError={(e) => handleImageError(e, 'banner')}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Gradient overlay for text readability */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10 transition-colors duration-500" />
                            </>
                        )}

                        <div className="relative z-10 w-full sm:w-2/3">
                            <span className="inline-block text-[10px] font-black uppercase tracking-[0.15em] bg-white/15 border border-white/20 px-3 py-1 rounded-full mb-4 shadow-sm"
                                style={{ color: b.badgeColor || '#fff' }}>
                                {b.badge}
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black mb-2 leading-tight">
                                {(b.title || "").split("\n").map((line, li) => (
                                    <span key={li}>{line}{li < (b.title || "").split("\n").length - 1 && <br />}</span>
                                ))}
                            </h3>
                            <p className="text-sm font-bold text-white/80 leading-relaxed mb-6 max-w-xs">{b.desc}</p>
                            <Link to={b.ctaLink || "/products"} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-white group-hover:gap-2.5 transition-all">
                                {b.ctaText} <ArrowRight size={14} strokeWidth={3} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default MidBanners;
