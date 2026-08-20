import { useState, useEffect, useMemo } from "react";
import {
    LayoutGrid,
    List,
    X,
    SlidersHorizontal,
    PackageSearch,
    Loader2,
    Search,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../Components/ProductCard.jsx";
import ProductListItem from "../Components/ProductListItem";
import Pagination from "../Components/Pagination";
import { useGetAllProducts } from "../api/hooks/product.api";

const ProductListPage = () => {
    const [viewMode, setViewMode] = useState("grid");
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const { getAllProducts, loading: productLoading } = useGetAllProducts();

    const page = parseInt(searchParams.get("page") || "1");
    const searchQuery = searchParams.get("search");

    const handlePageChange = (newPage) => {
        setSearchParams((prev) => {
            prev.set("page", newPage);
            return prev;
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    useEffect(() => {
        (async () => {
            const response = await getAllProducts({
                page,
                search: searchQuery
            });
            if (response?.success) {
                setProducts(response.products);
                setTotalPages(response.totalPages || 1);
            }
        })();
    }, [page, searchQuery]);

    // Searching is now handled on the server side
    const displayProducts = products;

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-8">
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-gray-200">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <SlidersHorizontal
                                    className="text-[#74AA34]"
                                    size={18}
                                />
                                <span className="text-sm text-gray-500 font-medium">
                                    Curated Health Essentials
                                </span>
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">
                                All Products
                            </h1>
                        </div>
                        <div className="text-xs font-bold text-[#3E6913] bg-[#EDF6E5] px-4 py-2 rounded-xl border border-[#D5EAC3]">
                            {products?.length || 0} Products
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <main className="flex-1 w-full">
                        <div className="bg-white border border-gray-200/90 rounded-2xl p-3 mb-6 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-2xs">
                            <div className="w-full flex items-center gap-2 bg-[#FAFBF9] px-3.5 py-2 rounded-xl border border-gray-200/80">
                                <Search size={18} className="text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search medicines, supplements, personal care..."
                                    className="px-1 py-1 text-sm w-full outline-none bg-transparent text-gray-900 placeholder-gray-400 font-sans"
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSearchParams((prev) => {
                                            if (val) prev.set("search", val);
                                            else prev.delete("search");
                                            prev.set("page", 1); // Reset to first page on search
                                            return prev;
                                        });
                                    }}
                                />
                            </div>

                            <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/80 shrink-0">
                                <ViewButton
                                    active={viewMode === "grid"}
                                    onClick={() => setViewMode("grid")}
                                    icon={<LayoutGrid size={18} />}
                                />
                                <ViewButton
                                    active={viewMode === "list"}
                                    onClick={() => setViewMode("list")}
                                    icon={<List size={18} />}
                                />
                            </div>
                        </div>

                        {productLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
                                <Loader2
                                    className="animate-spin text-[#74AA34] mb-3"
                                    size={32}
                                />
                                <p className="text-gray-500 text-sm font-medium">
                                    Loading products...
                                </p>
                            </div>
                        ) : products?.length === 0 ? (
                            <div className="bg-white border border-gray-200/80 rounded-2xl py-16 px-6 flex flex-col items-center justify-center shadow-2xs">
                                <div className="w-20 h-20 bg-[#F4F8EE] rounded-2xl flex items-center justify-center mb-4 text-[#74AA34]">
                                    <PackageSearch
                                        size={32}
                                    />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    No products found
                                </h3>
                                <p className="text-gray-500 text-sm mb-6 max-w-xs text-center">
                                    We couldn't find any products matching your search. Try searching with a different keyword.
                                </p>
                            </div>
                        ) : (
                            <div
                                className={
                                    viewMode === "grid"
                                        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                                        : "flex flex-col gap-4"
                                }
                            >
                                {displayProducts?.map((product) =>
                                    viewMode === "grid" ? (
                                        <ProductCard
                                            key={product._id || product.id}
                                            product={product}
                                        />
                                    ) : (
                                        <ProductListItem
                                            key={product._id || product.id}
                                            product={product}
                                        />
                                    ),
                                )}
                            </div>
                        )}

                        <div className="mt-12 flex justify-center">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

const FilterChip = ({ label, onRemove }) => (
    <span className="flex items-center gap-2 bg-gray-900 text-white pl-3 pr-2 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all hover:bg-[#74AA34] group">
        {label}
        <button
            onClick={onRemove}
            className="bg-white/20 p-0.5 rounded group-hover:bg-white/30 transition-colors cursor-pointer"
        >
            <X size={12} />
        </button>
    </span>
);

const ViewButton = ({ active, onClick, icon }) => (
    <button
        onClick={onClick}
        className={`p-2 rounded-lg transition-all cursor-pointer ${
            active
                ? "bg-white text-[#74AA34] shadow-xs font-bold"
                : "text-gray-400 hover:text-gray-700"
        }`}
    >
        {icon}
    </button>
);

export default ProductListPage;