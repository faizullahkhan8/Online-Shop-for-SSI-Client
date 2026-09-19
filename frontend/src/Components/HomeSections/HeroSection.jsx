import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { handleImageError } from "../../utils/imageHelper";
import { useGetHeroSlides } from "../../api/hooks/hero.api.js";

const HeroSection = () => {
    const { slides, loading } = useGetHeroSlides();
    const [heroSlide, setHeroSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const goToSlide = useCallback((idx) => {
        setHeroSlide(idx);
    }, []);

    const prevSlide = useCallback(() => {
        setHeroSlide((p) => (p - 1 + (slides?.length || 1)) % (slides?.length || 1));
    }, [slides]);

    const nextSlide = useCallback(() => {
        setHeroSlide((p) => (p + 1) % (slides?.length || 1));
    }, [slides]);

    useEffect(() => {
        if (!slides || slides.length <= 1 || isPaused) return;
        const t = setInterval(() => setHeroSlide((p) => (p + 1) % slides.length), 5500);
        return () => clearInterval(t);
    }, [slides, isPaused]);

    return (
        <div
            className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] xl:h-[500px] overflow-hidden group bg-gray-100"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {loading ? (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            ) : (!slides || slides.length === 0) ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-pale to-white">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl font-black text-primary">Z</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-500">Welcome to Zada Pharmacy</p>
                    </div>
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
                                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${isActive ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105 pointer-events-none"}`}
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

                    {/* Gradient overlays for depth */}
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                    {/* Navigation Arrows */}
                    {slides.length > 1 && (
                        <>
                            <button
                                onClick={prevSlide}
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0 cursor-pointer"
                                aria-label="Previous slide"
                            >
                                <ChevronLeft size={24} />
                            </button>

                            <button
                                onClick={nextSlide}
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 cursor-pointer"
                                aria-label="Next slide"
                            >
                                <ChevronRight size={24} />
                            </button>

                            {/* Navigation Dots */}
                            <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                                {slides.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => goToSlide(idx)}
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
