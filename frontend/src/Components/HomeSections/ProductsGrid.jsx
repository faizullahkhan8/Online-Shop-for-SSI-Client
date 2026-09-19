import { useRef } from "react";
import SectionHeader from "./SectionHeader";
import ProductCard from "../ProductCard";
import { ProductGridSkeleton } from "../UI/Skeleton";
import useScrollReveal from "../../hooks/useScrollReveal";

const ProductsGrid = ({ config, products, sliceRange = [0, 6], loading = false }) => {
    const gridRef = useRef(null);
    useScrollReveal(gridRef);
    const displayProducts = products?.slice(sliceRange[0], sliceRange[1]) || [];
    const isEmpty = !loading && displayProducts.length === 0;

    return (
        <section className="site-shell mt-14">
            <SectionHeader 
                title={config.title} 
                subtitle={config.subtitle} 
                cta={config.ctaText} 
                ctaPath={config.ctaLink} 
            />
            {loading ? (
                <ProductGridSkeleton count={sliceRange[1] - sliceRange[0]} />
            ) : isEmpty ? null : (
                <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {displayProducts.map((prod) => (
                        <ProductCard key={prod._id || prod.id} product={prod} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default ProductsGrid;
