import { useState, useEffect } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetHeroSlides } from "../../api/hooks/hero.api.js";

const HeroSection = () => {
    const { getSlides, slides, loading } = useGetHeroSlides();
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        getSlides();
    }, [getSlides]);

    useEffect(() => {
        if (slides.length > 0) {
            const timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [slides.length]);

    if (loading && slides.length === 0) {
        return (
            <div className="w-full h-[250px] sm:h-[350px] md:h-[450px] bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#74AA34]" size={32} />
            </div>
        );
    }

    if (slides.length === 0) return null;

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

    return (
        <div className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] xl:h-[500px] overflow-hidden group bg-gray-100">
            {slides.map((slide, idx) => {
                const isActive = idx === currentSlide;
                return (
                    <div
                        key={idx}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                            isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                        }`}
                    >
                        <img
                            src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${slide.image}`}
                            alt={slide.headline || `Banner ${idx + 1}`}
                            className="w-full h-full object-cover object-center"
                        />
                    </div>
                );
            })}

            {/* Navigation Arrows */}
            <button 
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0"
            >
                <ChevronLeft size={24} />
            </button>
            
            <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0"
            >
                <ChevronRight size={24} />
            </button>

            {/* Navigation Dots */}
            <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer shadow-sm ${
                            currentSlide === idx
                                ? "w-8 bg-[#74AA34]"
                                : "w-2 bg-white/60 hover:bg-white"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroSection;