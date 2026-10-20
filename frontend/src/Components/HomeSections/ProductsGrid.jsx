import SectionHeader from "./SectionHeader";
import ProductCard from "../ProductCard";

const ProductsGrid = ({ config, products, sliceRange = [0, 6] }) => {
    if (!products?.length) return null;
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
            <SectionHeader 
                title={config.title} 
                subtitle={config.subtitle} 
                cta={config.ctaText} 
                ctaPath={config.ctaLink} 
            />
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-5">
                {products.slice(sliceRange[0], sliceRange[1]).map((prod) => (
                    <ProductCard key={prod._id || prod.id} product={prod} />
                ))}
            </div>
        </section>
    );
};

export default ProductsGrid;
