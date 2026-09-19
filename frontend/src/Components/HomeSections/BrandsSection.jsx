import { useEffect, useState } from "react";
import SectionHeader from "./SectionHeader";
import { getImageUrl, handleImageError } from "../../utils/imageHelper";
import { useGetAllVendors } from "../../api/hooks/vendor.api";
import { Loader2 } from "lucide-react";

const BrandsSection = ({ config }) => {
    const sources = config.sources || (config.source ? [config.source] : (config.brands ? ["manual"] : []));
    const fetchVendors = sources.includes("vendors");
    
    const { data: vendorsData, loading } = useGetAllVendors();
    const vendors = fetchVendors && vendorsData?.success ? (vendorsData.vendors || []) : [];

    // Combine sources
    let displayBrands = [];
    if (sources.includes("manual")) {
        const manualBrands = config.brands || [];
        displayBrands = [...displayBrands, ...manualBrands];
    }
    if (sources.includes("vendors")) {
        const selectedIds = config.selectedVendors || [];
        // Only show explicitly selected vendors. If none are selected, show none.
        const filteredVendors = vendors.filter(v => selectedIds.includes(v._id));
            
        displayBrands = [...displayBrands, ...filteredVendors];
    }
    
    // Keep the homepage selection intentional and balanced.
    displayBrands = displayBrands.slice(0, 18);

    if (!loading && displayBrands.length === 0) return null;

    const renderBrandCard = (brand, key, isDuplicate = false) => (
        <div
            key={key}
            aria-hidden={isDuplicate ? "true" : undefined}
            className="brand-marquee-card w-[172px] sm:w-[190px] h-[158px] shrink-0 bg-white rounded-[1.65rem] border border-gray-100 p-2.5 flex flex-col items-center text-center shadow-sm hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
        >
            <div className="w-full h-[112px] rounded-[1.2rem] bg-white text-primary flex items-center justify-center font-black text-sm sm:text-base overflow-hidden">
                {brand.image ? (
                    <img
                        src={getImageUrl(brand.image, "vendor")}
                        alt={isDuplicate ? "" : `${brand.name} official logo`}
                        onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                        }}
                        className="w-full h-full object-cover"
                    />
                ) : null}
                <span
                    style={{ display: brand.image ? "none" : "flex" }}
                    className="w-20 h-20 rounded-full bg-primary-pale items-center justify-center shadow-inner"
                >
                    {brand.abbr || brand.name?.substring(0, 3).toUpperCase()}
                </span>
            </div>
            <span className="px-1 pt-1 text-[12px] sm:text-[13px] font-black text-gray-800 leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[2rem] flex items-center justify-center">
                {brand.name}
            </span>
        </div>
    );

    return (
        <section className="site-shell mt-14">
            <SectionHeader title={config.title} subtitle={config.subtitle} cta={config.ctaText} ctaPath={config.ctaLink} />
            
            {loading && fetchVendors && displayBrands.length === 0 ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 size={32} className="animate-spin text-primary" />
                </div>
            ) : (
                <div className="brand-marquee relative overflow-hidden py-2" aria-label="Healthcare partner brands">
                    <div className="brand-marquee-track flex w-max">
                        <div className="brand-marquee-group flex gap-3 sm:gap-4 pr-3 sm:pr-4">
                            {displayBrands.map((brand, idx) => renderBrandCard(brand, `brand-${idx}`))}
                        </div>
                        <div className="brand-marquee-group flex gap-3 sm:gap-4 pr-3 sm:pr-4" aria-hidden="true">
                            {displayBrands.map((brand, idx) => renderBrandCard(brand, `brand-copy-${idx}`, true))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default BrandsSection;
