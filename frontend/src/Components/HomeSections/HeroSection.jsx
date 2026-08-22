import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { handleImageError } from "../../utils/imageHelper";
import { useGetHeroSlides } from "../../api/hooks/hero.api.js";

const HeroSection = () => {
    const { getSlides, slides, loading } = useGetHeroSlides();
    const [heroSlide, setHeroSlide] = useState(0);

    useEffect(() => {
        getSlides().catch(() => {});
    }, [getSlides]);

    useEffect(() => {
        if (!slides || slides.length === 0) return;
        const t = setInterval(() => setHeroSlide((p) => (p + 1) % slides.length), 5500);
        return () => clearInterval(t);
    }, [slides]);

    return (
        <div className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] xl:h-[500px] overflow-hidden group bg-gray-100">
            {loading ? (
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
                                    onError={(e) => handleImageError(e, "carousel")}
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
                                            ? "w-8 bg-primary"
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
    );
};

export default HeroSection;
