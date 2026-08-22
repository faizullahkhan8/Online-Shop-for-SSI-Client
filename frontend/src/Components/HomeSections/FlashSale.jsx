import { Timer } from "lucide-react";
import ProductCard from "../ProductCard";

const FlashSale = ({ config, products }) => {
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
            <div className="flex items-end justify-between mb-7">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="block w-5 h-[2px] rounded-full bg-amber-500" />
                        <span className="font-sans text-[10px] font-black uppercase tracking-[0.18em] text-amber-500 flex items-center gap-1.5">
                            <Timer size={14} strokeWidth={3} /> {config.subtitle}
                        </span>
                    </div>
                    <h2 className="font-sans text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{config.title}</h2>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.slice(0, 6).map((prod) => (
                    <ProductCard key={prod._id || prod.id} product={prod} />
                ))}
            </div>
        </section>
    );
};

export default FlashSale;
