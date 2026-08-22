import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "../ProductCard";

const RibbonSection = ({ config, products }) => {
    if (!products || products.length === 0) return null;

    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
            <div className="bg-primary-pale/50 border border-primary-light rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                    <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-[0.18em] mb-2">{config.subtitle}</p>
                        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{config.title}</h3>
                    </div>
                    <Link to="/products" className="inline-flex items-center gap-2 text-xs font-black text-primary hover:text-primary-dark uppercase tracking-widest transition-colors group">
                        View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                    {products.slice(0, 6).map((prod) => (
                        <ProductCard key={prod._id || prod.id} product={prod} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RibbonSection;
