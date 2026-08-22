import { Link } from "react-router-dom";
import SectionHeader from "./SectionHeader";
import { getImageUrl, handleImageError } from "../../utils/imageHelper";

const CategoriesSection = ({ config, categories }) => {
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-12">
            <SectionHeader 
                title={config.title} 
                subtitle={config.subtitle} 
                cta={config.ctaText} 
                ctaPath={config.ctaLink} 
            />

            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
                {categories.map((cat, idx) => {
                    const IconComp = cat.icon;
                    return (
                        <Link
                            key={idx}
                            to={cat.path || `/products?category=${cat.name}`}
                            className="flex flex-col items-center group transition-all duration-200 text-center"
                        >
                            {/* Image / Icon Container */}
                            <div
                                className={`w-full aspect-square rounded-3xl border-2 overflow-hidden flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1 ${cat.border || "border-gray-100 hover:border-primary"} ${cat.image ? "bg-white" : cat.bg || "bg-primary-pale"
                                    }`}
                            >
                                {cat.image ? (
                                    <img
                                        src={getImageUrl(cat.image)}
                                        alt={cat.name}
                                        onError={(e) => handleImageError(e, "category")}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                ) : IconComp ? (
                                    <IconComp
                                        size={32}
                                        strokeWidth={2}
                                        className={`${cat.iconClass || "text-primary"} group-hover:scale-110 transition-transform duration-300`}
                                    />
                                ) : (
                                    <span className="text-primary font-bold text-xl">{cat.name.charAt(0)}</span>
                                )}
                            </div>

                            {/* Category Name */}
                            <span
                                className={`mt-3 font-sans text-xs sm:text-sm font-black ${cat.label || "text-gray-900"} group-hover:text-primary transition-colors leading-tight text-center line-clamp-2`}
                            >
                                {cat.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};

export default CategoriesSection;
