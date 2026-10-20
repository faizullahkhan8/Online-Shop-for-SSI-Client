import { QueryError } from "../../UI/QueryState";
import {
    useDeleteProduct,
    useGetAllProducts,
} from "../../api/hooks/product.api.js";
import { useState, useEffect } from "react";
import { Edit, MoreVertical, PackageOpen, Trash } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import DeleteDialog from "../../UI/DialogBox.jsx";
import Pagination from "../../Components/Pagination.jsx";

const ProductList = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get("page") || "1");

    const {
        data: productsData,
        loading: getAllProductsLoading,
        error: getAllProductsError,
    } = useGetAllProducts({ page, limit: 10 });
    const queryError = getAllProductsError;
    const products = productsData?.products || [];
    const totalPages = productsData?.totalPages || 1;


    const handlePageChange = (newPage) => {
        setSearchParams((prev) => {
            prev.set("page", newPage);
            return prev;
        });
    };

    const { deleteProduct, loading: deleteProductLoading } = useDeleteProduct();

    const [productState, setProductState] = useState({
        type: "",
        data: null,
    });

    const handleDelete = async () => {
        const response = await deleteProduct(productState.data._id);
        if (response?.success) {
            setProductState({ type: "", data: null });
        }
    };

    if (queryError) return <QueryError />;

    return (
        <div className="space-y-6">
            <DeleteDialog
                isOpen={Boolean(productState.type === "delete")}
                onClose={() => setProductState({ type: "", data: null })}
                onConfirm={handleDelete}
                title="Delete Product"
                message="Are you sure you want to delete this product? This action cannot be undone."
                loading={deleteProductLoading}
            />

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display text-gray-900">
                        Products
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage your product inventory ({products.length} items)
                    </p>
                </div>
            </header>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm transition-colors duration-200 overflow-hidden">
                <div role="region" aria-label="Products table" tabIndex={0} className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                    Product
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                    Category
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                    Price
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                    Stock
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {getAllProductsLoading && products.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-16 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
                                            <p className="text-sm font-medium text-gray-500">
                                                Loading products...
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : getAllProductsError ? (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <PackageOpen size={48} className="text-red-300" strokeWidth={1.5} />
                                            <p className="text-sm font-semibold text-gray-900">
                                                Products could not be loaded
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Please refresh the page or check the backend connection.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length > 0 ? (
                                products.map((product) => (
                                    <tr
                                        key={product._id}
                                        className="group hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                                                    <img
                                                        src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${product.image}`}
                                                        className="w-full h-full object-cover"
                                                        alt={product.name}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 line-clamp-2 max-w-50">
                                                    {product.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                                                {product.category
                                                    ? product.category.name
                                                    : "Uncategorized"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {(() => {
                                                    const prices = (product.variants || [])
                                                        .filter((variant) => variant.active !== false)
                                                        .map((variant) => Number(variant.price))
                                                        .filter(Number.isFinite);
                                                    const low = prices.length ? Math.min(...prices) : Number(product.price);
                                                    const high = prices.length ? Math.max(...prices) : low;
                                                    return high === low
                                                        ? `Rs ${low.toLocaleString()}`
                                                        : `Rs ${low.toLocaleString()} – Rs ${high.toLocaleString()}`;
                                                })()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`h-2 w-2 rounded-full ${product.stock > 10 ? "bg-green-500" : product.stock > 0 ? "bg-amber-500" : "bg-red-500"}`}
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {product.stock}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right flex gap-2 justify-end">
                                            <Link
                                                to={`/admin-dashboard/products/add?isEditing=true&product=${encodeURIComponent(JSON.stringify(product))}`}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <Edit
                                                    size={16}
                                                    className="text-primary hover:text-primary-dark transition-colors"
                                                />
                                            </Link>
                                            <button aria-label="Delete item"
                                                onClick={() => {
                                                    setProductState({
                                                        type: "delete",
                                                        data: product,
                                                    });
                                                }}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-24 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <PackageOpen
                                                size={48}
                                                className="text-gray-300"
                                                strokeWidth={1.5}
                                            />
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    No products found
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Get started by adding your
                                                    first product
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
};

export default ProductList;
