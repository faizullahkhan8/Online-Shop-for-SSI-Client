import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getImageUrl, handleImageError } from "../../utils/imageHelper";

const SingleMidBanner = ({ config }) => {
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-6">
            <div className="relative rounded-3xl text-white overflow-hidden p-8 sm:p-12 md:p-16 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[300px] sm:min-h-[360px] flex items-center"
                style={{ background: `linear-gradient(to right, ${config.bgFrom || '#1e4d28'}, ${config.bgTo || '#4d8d3a'})` }}>
                
                {/* Background Shapes */}
                <div className="absolute right-0 bottom-0 w-64 h-64 rounded-full bg-white/10 -mr-16 -mb-16 blur-2xl transition-transform duration-500 group-hover:scale-125" />
                
                {/* Banner Image (if provided) */}
                {config.image && (
                    <>
                        <img 
                            src={getImageUrl(config.image, 'banner')} 
                            alt={config.title} 
                            onError={(e) => handleImageError(e, 'banner')}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Gradient overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10 transition-colors duration-500" />
                    </>
                )}

                <div className="relative z-10 w-full sm:w-1/2 md:w-2/3 max-w-2xl">
                    <span className="inline-block text-xs font-black uppercase tracking-[0.15em] bg-white/15 border border-white/20 px-4 py-1.5 rounded-full mb-6 shadow-sm"
                        style={{ color: config.badgeColor || '#fff' }}>
                        {config.badge}
                    </span>
                    <h3 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 leading-tight">
                        {(config.title || "").split("\n").map((line, li) => (
                            <span key={li}>{line}{li < (config.title || "").split("\n").length - 1 && <br />}</span>
                        ))}
                    </h3>
                    <p className="text-base sm:text-lg font-bold text-white/80 leading-relaxed mb-8 max-w-xl">{config.desc}</p>
                    <Link to={config.ctaLink || "/products"} className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white group-hover:gap-3 transition-all">
                        {config.ctaText} <ArrowRight size={16} strokeWidth={3} />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default SingleMidBanner;
