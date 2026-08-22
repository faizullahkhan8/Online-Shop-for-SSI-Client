import SectionHeader from "./SectionHeader";
import ProductCard from "../ProductCard";

const ProductsGrid = ({ config, products, sliceRange = [0, 6] }) => {
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
            <SectionHeader 
                title={config.title} 
                subtitle={config.subtitle} 
                cta={config.ctaText} 
                ctaPath={config.ctaLink} 
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.slice(sliceRange[0], sliceRange[1]).map((prod) => (
                    <ProductCard key={prod._id || prod.id} product={prod} />
                ))}
            </div>
        </section>
    );
};

export default ProductsGrid;
