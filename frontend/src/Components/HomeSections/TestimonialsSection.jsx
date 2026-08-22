import { Star } from "lucide-react";
import SectionHeader from "./SectionHeader";

const DEFAULT_TESTIMONIALS = [
    { name: "Ahmed R.", rating: 5, comment: "Amazing delivery speed and very helpful pharmacists. Will always buy my medicines here from now on.", city: "Karachi" }
];

const TestimonialsSection = ({ config }) => {
    const testimonials = config.testimonials?.length ? config.testimonials : DEFAULT_TESTIMONIALS;

    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14 bg-primary-pale/30 rounded-3xl p-6 sm:p-10 border border-primary-light">
            <SectionHeader title={config.title} subtitle={config.subtitle} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {testimonials.map((t, i) => (
                    <div key={i} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-lg border border-gray-100 hover:border-primary-light transition-all duration-300 flex flex-col group">
                        <div className="flex items-center gap-1 mb-4 text-amber-400">
                            {[...Array(5)].map((_, j) => (
                                <Star 
                                    key={j} 
                                    size={16} 
                                    fill={j < t.rating ? "currentColor" : "none"} 
                                    strokeWidth={j < t.rating ? 0 : 2}
                                    className={j < t.rating ? "" : "text-gray-300"} 
                                />
                            ))}
                        </div>
                        <p className="text-sm font-bold text-gray-700 italic flex-1 mb-6 leading-relaxed">"{t.comment}"</p>
                        <div className="mt-auto flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-pale text-primary flex items-center justify-center font-black text-sm group-hover:bg-primary group-hover:text-white transition-colors">
                                {t.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-black text-xs text-gray-900">{t.name}</p>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t.city}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default TestimonialsSection;
