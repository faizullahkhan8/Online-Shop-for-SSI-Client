import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Package, Plus, Filter } from "lucide-react";
import { useGetAllProducts } from "../../api/hooks/product.api";
import { useGetAllCategories } from "../../api/hooks/category.api";

const ProductSelector = ({
    selectedProducts = [],
    onChange = () => {},
    excludeActivePromotions = false,
    currentPromotionId = null,
    multiple = true,
}) => {
    const { getAllProducts } = useGetAllProducts();
    const { getAllCategories } = useGetAllCategories();

    const [productSearch, setProductSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [productType, setProductType] = useState("all");
    const [vendor, setVendor] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const [categories, setCategories] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [noProductFound, setNoProductFound] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            const res = await getAllCategories();
            if (res && res.categories) setCategories(res.categories);
        };
        fetchCategories();
    }, [getAllCategories]);

    // Fetch products based on search or page changes
    const fetchProducts = useCallback(async () => {
        setIsSearching(true);
        setNoProductFound(false);
        try {
            const response = await getAllProducts({
                search: productSearch,
                category: selectedCategory === "all" ? undefined : selectedCategory,
                productType: productType === "all" ? undefined : productType,
                vendor: vendor || undefined,
                minPrice: minPrice || undefined,
                maxPrice: maxPrice || undefined,
                page: page,
                limit: 12,
                excludeActivePromotions: excludeActivePromotions ? "true" : undefined,
                currentPromotionId: currentPromotionId,
            });
            if (response?.success) {
                setAvailableProducts(response.products);
                setTotalPages(response.totalPages);
                if (response.products.length === 0) {
                    setNoProductFound(true);
                }
            } else {
                setAvailableProducts([]);
                setNoProductFound(true);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setIsSearching(false);
        }
    }, [
        productSearch,
        selectedCategory,
        productType,
        vendor,
        minPrice,
        maxPrice,
        page,
        getAllProducts,
        excludeActivePromotions,
        currentPromotionId,
    ]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts();
        }, 300); // Debounce fetch
        return () => clearTimeout(timeoutId);
    }, [fetchProducts]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [productSearch, selectedCategory, productType, vendor, minPrice, maxPrice]);

    const handleSelectAll = () => {
        if (!multiple) return;
        const newProducts = availableProducts.filter(
            (p) => !selectedProducts.some((sp) => sp._id === p._id)
        );
        onChange([...selectedProducts, ...newProducts]);
    };

    const toggleProduct = (product) => {
        const isSelected = selectedProducts.some((p) => p._id === product._id);
        if (isSelected) {
            onChange(selectedProducts.filter((p) => p._id !== product._id));
        } else {
            if (multiple) {
                onChange([...selectedProducts, product]);
            } else {
                onChange([product]);
            }
        }
    };

    const clearFilters = () => {
        setProductSearch("");
        setSelectedCategory("all");
        setProductType("all");
        setVendor("");
        setMinPrice("");
        setMaxPrice("");
    };

    return (
        <div className="space-y-4">
            <section className="bg-white border border-gray-200 rounded-lg flex flex-col min-h-[400px]">
                <div className="p-5 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Package size={16} className="text-primary" />
                            Product Selection
                        </h3>
                        <button
                            type="button"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary transition-colors"
                        >
                            <Filter size={14} />
                            {showAdvancedFilters ? "Hide Filters" : "Advanced Filters"}
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mb-3">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search products by name..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {isSearching ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    <Search size={16} />
                                )}
                            </div>
                        </div>

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Categories</option>
                            {categories.map((c) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>

                        {multiple && (
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                disabled={availableProducts.length === 0}
                                className="px-4 py-2 bg-primary-pale text-primary rounded-lg text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                Select All on Page
                            </button>
                        )}
                    </div>

                    {showAdvancedFilters && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100 mt-2">
                            <select
                                value={productType}
                                onChange={(e) => setProductType(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="all">All Types</option>
                                <option value="standard">Standard</option>
                                <option value="prescription">Prescription</option>
                                <option value="bundle">Bundle</option>
                            </select>
                            
                            <input
                                type="text"
                                placeholder="Vendor Name..."
                                value={vendor}
                                onChange={(e) => setVendor(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />

                            <input
                                type="number"
                                placeholder="Min Price"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />

                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Max Price"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 p-5 overflow-y-auto">
                    {isSearching && availableProducts.length === 0 ? (
                        <div className="h-full flex items-center justify-center min-h-[200px]">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : noProductFound ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 min-h-[200px]">
                            <Search size={32} className="text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">
                                No products found matching your criteria.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                            {availableProducts.map((p) => {
                                const isSelected = selectedProducts.some(
                                    (sp) => sp._id === p._id
                                );
                                return (
                                    <button
                                        key={p._id}
                                        type="button"
                                        onClick={() => toggleProduct(p)}
                                        className={`relative p-3 rounded-lg border transition-all flex flex-col items-center text-center gap-2 ${
                                            isSelected
                                                ? "bg-primary-pale border-blue-500"
                                                : "bg-white border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        <div className="w-full aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100 p-2">
                                            <img
                                                src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${p.image}`}
                                                className="w-full h-full object-contain"
                                                alt={p.name}
                                            />
                                        </div>
                                        <div className="w-full">
                                            <p className="text-xs font-medium text-gray-900 truncate">
                                                {p.name}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                PKR {p.price?.toLocaleString()}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center">
                                                <Plus size={12} className="rotate-45" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
                        <button
                            type="button"
                            disabled={page === 1}
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={page === totalPages}
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
                        >
                            Next
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ProductSelector;
