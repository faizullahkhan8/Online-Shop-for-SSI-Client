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
    const [products, setProducts] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();

    const page = parseInt(searchParams.get("page") || "1");

    const { getAllProducts, loading: getAllProductsLoading } =
        useGetAllProducts();
    const { deleteProduct, loading: deleteProductLoading } = useDeleteProduct();

    const [productState, setProductState] = useState({
        type: "",
        data: null,
    });

    useEffect(() => {
        (async () => {
            const response = await getAllProducts({ page, limit: 10 });
            if (response?.success) {
                setProducts(response.products);
                setTotalPages(response.totalPages || 1);
            }
        })();
    }, [page]);

    const handlePageChange = (newPage) => {
        setSearchParams((prev) => {
            prev.set("page", newPage);
            return prev;
        });
    };

    const handleDelete = async () => {
        const response = await deleteProduct(productState.data._id);
        if (response?.success) {
            setProducts(
                products.filter(
                    (product) => product._id !== productState.data._id,
                ),
            );
            setProductState({ type: "", data: null });
        }
    };

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
                    <h2 className="text-2xl font-bold text-gray-900">
                        Products
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage your product inventory ({products.length} items)
                    </p>
                </div>
            </header>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 border-b border-gray-200">
                                    Product
                                </th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 border-b border-gray-200">
                                    Category
                                </th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 border-b border-gray-200">
                                    Price
                                </th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 border-b border-gray-200">
                                    Stock
                                </th>
                                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-700 border-b border-gray-200">
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
                                            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                                            <p className="text-sm font-medium text-gray-500">
                                                Loading products...
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
                                                Rs{" "}
                                                {Number(
                                                    product.price,
                                                ).toLocaleString()}
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
                                                    className="text-blue-600"
                                                />
                                            </Link>
                                            <button
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
