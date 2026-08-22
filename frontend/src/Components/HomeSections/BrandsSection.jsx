import { useEffect, useState } from "react";
import SectionHeader from "./SectionHeader";
import { getImageUrl, handleImageError } from "../../utils/imageHelper";
import { useGetAllVendors } from "../../api/hooks/vendor.api";
import { Loader2 } from "lucide-react";

const DEFAULT_BRANDS = [
    { name: "GSK Healthcare", abbr: "GSK" },
    { name: "Abbott Laboratories", abbr: "ABT" },
    { name: "Bayer Pharma", abbr: "BAY" },
    { name: "Reckitt Benckiser", abbr: "RKT" },
    { name: "Pfizer Health", abbr: "PFZ" },
    { name: "Sanofi Pasteur", abbr: "SNF" },
    { name: "Getz Pharma", abbr: "GTZ" },
];

const BrandsSection = ({ config }) => {
    const { getAllVendors, loading } = useGetAllVendors();
    const [vendors, setVendors] = useState([]);

    // Determine sources array (fallback for older configs that used string `source` or nothing)
    const sources = config.sources || (config.source ? [config.source] : ["manual"]);
    const fetchVendors = sources.includes("vendors");

    useEffect(() => {
        if (fetchVendors) {
            getAllVendors().then(res => {
                if (res?.success) setVendors(res.vendors || []);
            }).catch(() => {});
        }
    }, [fetchVendors, getAllVendors]);

    // Combine sources
    let displayBrands = [];
    if (sources.includes("manual")) {
        // If config.brands is undefined, use DEFAULT_BRANDS. If it's an empty array [], the user explicitly deleted all manual brands, so use []
        const manualBrands = config.brands !== undefined ? config.brands : DEFAULT_BRANDS;
        displayBrands = [...displayBrands, ...manualBrands];
    }
    if (sources.includes("vendors")) {
        const selectedIds = config.selectedVendors || [];
        // Only show explicitly selected vendors. If none are selected, show none.
        const filteredVendors = vendors.filter(v => selectedIds.includes(v._id));
            
        displayBrands = [...displayBrands, ...filteredVendors];
    }
    
    // Optional: Slice to a reasonable maximum so it doesn't break layout if they have 50 vendors
    displayBrands = displayBrands.slice(0, 14);

    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
            <SectionHeader title={config.title} subtitle={config.subtitle} cta={config.ctaText} ctaPath={config.ctaLink} />
            
            {loading && fetchVendors && displayBrands.length === 0 ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 size={32} className="animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-7 gap-3">
                    {displayBrands.map((brand, idx) => (
                        <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-5 flex flex-col items-center justify-center text-center shadow-sm hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer h-full">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary-pale text-primary flex items-center justify-center font-black text-xs sm:text-sm mb-3 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-inner overflow-hidden">
                                {brand.image ? (
                                    <img 
                                        src={getImageUrl(brand.image, 'vendor')} 
                                        alt={brand.name}
                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                        className="w-full h-full object-cover"
                                    />
                                ) : null}
                                <span style={{ display: brand.image ? 'none' : 'flex' }} className="w-full h-full items-center justify-center">
                                    {brand.abbr || brand.name?.substring(0, 3).toUpperCase()}
                                </span>
                            </div>
                            <span className="text-[11px] font-black text-gray-700 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                {brand.name}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default BrandsSection;
