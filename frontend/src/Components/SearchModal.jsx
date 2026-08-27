import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    X,
    TrendingUp,
    ArrowUpRight,
    Loader2,
    Package,
    Layers,
    ChevronRight,
    Sparkles,
} from "lucide-react";
import { useGetAllProducts } from "../api/hooks/product.api";
import { useGetAllCategories } from "../api/hooks/category.api";
import { getImageUrl, handleImageError } from "../utils/imageHelper";

const RECENT_SEARCHES_KEY = "zada_recent_searches";

// Curated default trending search terms
const DEFAULT_TRENDING_SEARCHES = [
    "Centrum",
    "Surbex Z",
    "Panadol",
    "Vitamin D",
    "Omega 3",
    "Nutrifactor",
    "Face Wash",
    "Baby Diapers",
    "Calcium",
];

const SearchModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const modalRef = useRef(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [recentSearches, setRecentSearches] = useState([]);
    
    const [searchResults, setSearchResults] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const { getAllProducts } = useGetAllProducts();
    const { getAllCategories } = useGetAllCategories();

    // 1. Load Recent Searches from LocalStorage
    useEffect(() => {
        if (isOpen) {
            try {
                const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
                if (stored) {
                    setRecentSearches(JSON.parse(stored));
                }
            } catch (err) {
                console.error("Failed to load recent searches:", err);
            }
        }
    }, [isOpen]);

    // Save recent search
    const addRecentSearch = (term) => {
        if (!term || !term.trim()) return;
        const clean = term.trim();
        const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
        setRecentSearches(updated);
        try {
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch (err) {
            console.error("Failed to save recent search:", err);
        }
    };

    // Remove single recent search
    const removeRecentSearch = (e, termToRemove) => {
        e.stopPropagation();
        const updated = recentSearches.filter((s) => s !== termToRemove);
        setRecentSearches(updated);
        try {
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch (err) {
            console.error("Failed to update recent searches:", err);
        }
    };

    // Clear all recent searches
    const clearAllRecent = () => {
        setRecentSearches([]);
        try {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch (err) {
            console.error("Failed to clear recent searches:", err);
        }
    };

    // 2. Fetch Initial Trending Products & Categories on Mount / Open
    useEffect(() => {
        if (isOpen) {
            // Fetch popular / trending products
            getAllProducts({ limit: 8 }).then((res) => {
                if (res?.products) {
                    setTrendingProducts(res.products);
                }
            });

            // Fetch categories
            getAllCategories().then((res) => {
                if (res?.categories) {
                    setAllCategories(res.categories);
                }
            });

            // Auto-focus input
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);

            // Prevent background scrolling
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            setSearchTerm("");
            setDebouncedQuery("");
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // 3. Debounce search input typing (250ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchTerm.trim());
        }, 250);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // 4. Perform Live Search when debouncedQuery changes
    useEffect(() => {
        if (!debouncedQuery) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        let isMounted = true;
        setIsSearching(true);

        getAllProducts({ search: debouncedQuery, limit: 12 })
            .then((res) => {
                if (isMounted) {
                    setSearchResults(res?.products || []);
                }
            })
            .catch(() => {
                if (isMounted) setSearchResults([]);
            })
            .finally(() => {
                if (isMounted) setIsSearching(false);
            });

        return () => {
            isMounted = false;
        };
    }, [debouncedQuery]);

    // 5. Generate matching search phrase suggestions based on search query and products
    const matchingSuggestions = useMemo(() => {
        if (!debouncedQuery) return [];
        const suggestions = new Set();
        
        // Add direct product title variations
        searchResults.forEach((p) => {
            if (p.name) {
                suggestions.add(p.name);
            }
        });

        // Add matching category names
        allCategories.forEach((cat) => {
            if (cat.name?.toLowerCase().includes(debouncedQuery.toLowerCase())) {
                suggestions.add(cat.name);
            }
        });

        return Array.from(suggestions).slice(0, 8);
    }, [debouncedQuery, searchResults, allCategories]);

    // 6. Matching Categories based on search query
    const matchingCategories = useMemo(() => {
        if (!debouncedQuery) {
            return allCategories.slice(0, 6);
        }
        return allCategories
            .filter((c) => c.name?.toLowerCase().includes(debouncedQuery.toLowerCase()))
            .slice(0, 6);
    }, [debouncedQuery, allCategories]);

    // Handle Keyboard events (Escape to close, Enter to submit search)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Navigation handlers
    const handleProductClick = (product) => {
        if (searchTerm.trim()) {
            addRecentSearch(searchTerm.trim());
        }
        onClose();
        navigate(`/product/${product._id || product.id}`);
    };

    const handleCategoryClick = (category) => {
        if (searchTerm.trim()) {
            addRecentSearch(searchTerm.trim());
        }
        onClose();
        navigate(`/products?category=${encodeURIComponent(category.name)}`);
    };

    const handleSuggestionClick = (queryText) => {
        setSearchTerm(queryText);
        addRecentSearch(queryText);
    };

    const handleSubmitSearch = (e) => {
        e?.preventDefault();
        if (!searchTerm.trim()) return;
        addRecentSearch(searchTerm.trim());
        onClose();
        navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    };

    if (!isOpen) return null;

    const displayProducts = debouncedQuery ? searchResults : trendingProducts;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-4 md:pt-14 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            {/* Backdrop click dismiss */}
            <div className="fixed inset-0" onClick={onClose} />

            {/* Modal Card */}
            <div
                ref={modalRef}
                className="relative w-full max-w-[840px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            >
                {/* -- 1. Top Search Header Input -- */}
                <div className="p-3.5 sm:p-4 border-b border-gray-100 bg-white sticky top-0 z-20">
                    <form onSubmit={handleSubmitSearch} className="relative flex items-center">
                        <Search
                            size={19}
                            className="absolute left-3.5 text-gray-400 pointer-events-none"
                        />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search for Medicines & more..."
                            className="w-full h-11 pl-11 pr-20 text-sm font-medium text-gray-900 bg-gray-50/80 hover:bg-gray-50 focus:bg-white rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-gray-400"
                        />
                        <div className="absolute right-3 flex items-center gap-1.5">
                            {isSearching ? (
                                <Loader2 size={16} className="animate-spin text-primary mr-1" />
                            ) : searchTerm ? (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm("")}
                                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors cursor-pointer"
                                    title="Clear"
                                >
                                    <X size={14} />
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                title="Close Modal (Esc)"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </form>
                </div>

                {/* -- 2. Scrollable Body Content -- */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-5 divide-y divide-gray-100/80">

                    {/* Section 1: Recent Searches (if available) */}
                    {recentSearches.length > 0 && (
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Recent Searches
                                </h4>
                                <button
                                    onClick={clearAllRecent}
                                    className="text-[11px] font-semibold text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                >
                                    Clear all
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {recentSearches.map((term, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleSuggestionClick(term)}
                                        className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100/80 hover:bg-primary-pale text-xs font-semibold text-gray-700 hover:text-primary transition-colors cursor-pointer border border-transparent hover:border-primary-light"
                                    >
                                        <span>{term}</span>
                                        <button
                                            type="button"
                                            onClick={(e) => removeRecentSearch(e, term)}
                                            className="p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-0.5"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section 2: Trending Searches OR Matching Search Suggestions */}
                    <div className="space-y-2.5 pt-4 first:pt-0">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            {debouncedQuery ? (
                                <>Matching Searches</>
                            ) : (
                                <>
                                    <TrendingUp size={13} className="text-primary" />
                                    Trending Searches
                                </>
                            )}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {(debouncedQuery ? matchingSuggestions : DEFAULT_TRENDING_SEARCHES).map(
                                (item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestionClick(item)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-primary-pale text-xs font-medium text-gray-700 hover:text-primary border border-gray-200 hover:border-primary/40 transition-all cursor-pointer shadow-2xs group"
                                    >
                                        <ArrowUpRight
                                            size={12}
                                            className="text-gray-400 group-hover:text-primary transition-colors"
                                        />
                                        <span className="truncate max-w-[220px]">{item}</span>
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Section 3: Matching Products OR Trending Products */}
                    <div className="space-y-3 pt-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Package size={13} className="text-primary" />
                                {debouncedQuery ? "Matching Products" : "Trending Products"}
                            </h4>
                            {debouncedQuery && searchResults.length > 0 && (
                                <button
                                    onClick={handleSubmitSearch}
                                    className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-0.5 cursor-pointer"
                                >
                                    View all ({searchResults.length}) <ChevronRight size={13} />
                                </button>
                            )}
                        </div>

                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                                <Loader2 size={24} className="animate-spin text-primary" />
                                <span className="text-xs">Searching pharmacy database...</span>
                            </div>
                        ) : displayProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                                {displayProducts.slice(0, 8).map((product) => {
                                    const hasDiscount =
                                        product.maxPrice && product.maxPrice > product.price;
                                    return (
                                        <div
                                            key={product._id || product.id}
                                            onClick={() => handleProductClick(product)}
                                            className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200/90 hover:border-primary/60 bg-white hover:bg-primary-pale/20 transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
                                        >
                                            {/* Product Image */}
                                            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-1 shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                                                <img
                                                    src={getImageUrl(product.image || product.images?.[0]?.filePath, "product")}
                                                    alt={product.name}
                                                    onError={(e) => handleImageError(e, "product")}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <h5 className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                                    {product.name}
                                                </h5>
                                                <div className="flex items-baseline gap-1.5 mt-1">
                                                    <span className="text-xs font-extrabold text-red-600">
                                                        Rs. {product.price?.toLocaleString()}
                                                    </span>
                                                    {hasDiscount && (
                                                        <span className="text-[10px] text-gray-400 line-through">
                                                            Rs. {product.maxPrice?.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Package size={28} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-xs font-bold text-gray-700">
                                    No matching products found
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    Try searching by generic name, brand, or therapeutic category
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Section 4: Trending Categories */}
                    {matchingCategories.length > 0 && (
                        <div className="space-y-3 pt-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers size={13} className="text-primary" />
                                {debouncedQuery ? "Matching Categories" : "Trending Categories"}
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {matchingCategories.map((cat) => (
                                    <button
                                        key={cat._id || cat.name}
                                        onClick={() => handleCategoryClick(cat)}
                                        className="flex items-center gap-2 p-2 rounded-xl bg-white hover:bg-primary-pale border border-gray-200/90 hover:border-primary/50 transition-all text-left group cursor-pointer shadow-2xs"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 p-0.5 overflow-hidden">
                                            <img
                                                src={getImageUrl(cat.image, "category")}
                                                alt={cat.name}
                                                onError={(e) => handleImageError(e, "category")}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-700 group-hover:text-primary truncate">
                                            {cat.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* -- 3. Modal Footer -- */}
                {debouncedQuery && (
                    <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            Showing results for <span className="font-bold text-gray-800">"{debouncedQuery}"</span>
                        </span>
                        <button
                            onClick={handleSubmitSearch}
                            className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                            View All Results <ChevronRight size={13} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchModal;
