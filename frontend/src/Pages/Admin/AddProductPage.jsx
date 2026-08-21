/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import Input from "../../UI/Input.jsx";
import Button from "../../UI/Button.jsx";
import Select from "../../UI/Select.jsx";
import ProductDetailsBuilder from "../../Components/ProductDetailsBuilder.jsx";
import {
    ImageIcon,
    Loader,
    Plus,
    Save,
    X,
    Hash,
    Layers,
    DollarSign,
    Box,
    Boxes,
} from "lucide-react";
import {
    useCreateProuduct,
    useUpdateProduct,
} from "../../api/hooks/product.api.js";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useGetAllCategories } from "../../api/hooks/category.api.js";

const INITAIL_STATE = {
    _id: "",
    name: "",
    slug: "",
    productType: "",
    vendor: "",
    price: "",
    minPrice: "",
    maxPrice: "",
    description: "",
    details: [],
    category: "",
    stock: "",
    lowStock: "",
    badges: [],
    image: null,
    images: [],
    isRemoveBg: false,
};

const AddProduct = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const parseProductFromParams = () => {
        try {
            const raw = searchParams.get("product");
            return raw ? JSON.parse(raw) : INITAIL_STATE;
        } catch {
            return INITAIL_STATE;
        }
    };

    const [productData, setProductData] = useState(parseProductFromParams);
    const isEditing = Boolean(productData?._id);

    const [categories, setCategories] = useState([]);
    const [previewUrl, setPreviewUrl] = useState("");

    const { createProduct, loading: createProductLoading } =
        useCreateProuduct();
    const { updateProduct, loading: updateProductLoading } = useUpdateProduct();
    const { getAllCategories } = useGetAllCategories();

    useEffect(() => {
        (async () => {
            const response = await getAllCategories();
            if (response.success) {
                setCategories(response.categories);
            }
        })();
    }, []);

    useEffect(() => {
        if (!productData.image) {
            setPreviewUrl("");
            return;
        }

        if (productData.image instanceof File) {
            const url = URL.createObjectURL(productData.image);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }

        if (typeof productData.image === "string") {
            setPreviewUrl(
                `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${productData.image}`,
            );
        }
    }, [productData.image]);

    const handleChange = (e) => {
        const { id, value, files, type } = e.target;
        if (type === "file") {
            const newFiles = Array.from(files);
            setProductData((prev) => ({ 
                ...prev, 
                images: [...(prev.images || []), ...newFiles] 
            }));
        } else {
            setProductData((prev) => ({ ...prev, [id]: value }));
        }
    };

    const removeImage = (index) => {
        setProductData((prev) => {
            const newImages = [...(prev.images || [])];
            newImages.splice(index, 1);
            return { ...prev, images: newImages };
        });
    };

    const handleBadgeToggle = (badgeName) => {
        setProductData((prev) => {
            const currentBadges = prev.badges || [];
            if (currentBadges.includes(badgeName)) {
                return { ...prev, badges: currentBadges.filter((b) => b !== badgeName) };
            }
            return { ...prev, badges: [...currentBadges, badgeName] };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();

        const { image, images, ...textData } = productData;
        const newImages = images?.filter((img) => img instanceof File) || [];
        const existingImages = images?.filter((img) => !(img instanceof File)) || [];

        textData.images = existingImages;

        if (!isEditing && newImages.length === 0 && !image) {
            return toast.error("Please select at least one image");
        }

        newImages.forEach((file) => {
            formData.append("images", file);
        });

        // Legacy compatibility
        if (image instanceof File && newImages.length === 0) {
            formData.append("images", image);
        }

        formData.append("data", JSON.stringify(textData));

        if (!isEditing) {
            const response = await createProduct(formData);
            if (response.success) navigate("/admin-dashboard/products");
        } else {
            const response = await updateProduct({
                product: formData,
                id: productData._id,
            });
            if (response.success)
                navigate("/admin-dashboard?tab=products-list");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {isEditing ? "Edit Product" : "Add New Product"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {isEditing
                            ? "Update product information"
                            : "Create a new product listing"}
                    </p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                    <X size={20} />
                </button>
            </header>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
                {/* Left Column - Product Details */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-5">
                        {/* Product Name */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                <Hash size={14} className="text-blue-600" />
                                Product Name
                            </label>
                            <Input
                                type="text"
                                id="name"
                                value={productData?.name}
                                placeholder="Enter product name"
                                className="w-full"
                                onChange={handleChange}
                                required
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Slug */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Hash size={14} className="text-blue-600" />
                                    Slug (URL)
                                </label>
                                <Input
                                    type="text"
                                    id="slug"
                                    value={productData?.slug}
                                    placeholder="Leave empty to auto-generate"
                                    className="w-full"
                                    onChange={handleChange}
                                />
                            </div>
                            
                            {/* Vendor */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Box size={14} className="text-blue-600" />
                                    Vendor
                                </label>
                                <Input
                                    type="text"
                                    id="vendor"
                                    value={productData?.vendor}
                                    placeholder="e.g. GSK"
                                    className="w-full"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Product Type & Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Layers size={14} className="text-blue-600" />
                                    Product Type
                                </label>
                                <Input
                                    type="text"
                                    id="productType"
                                    value={productData?.productType}
                                    placeholder="e.g. Tablets"
                                    className="w-full"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <DollarSign
                                        size={14}
                                        className="text-blue-600"
                                    />
                                    Price (Rs)
                                </label>
                                <Input
                                    type="number"
                                    id="price"
                                    value={productData?.price}
                                    placeholder="0.00"
                                    step="0.01"
                                    className="w-full"
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <DollarSign size={14} className="text-blue-600" />
                                    Min Price
                                </label>
                                <Input
                                    type="number"
                                    id="minPrice"
                                    value={productData?.minPrice}
                                    placeholder="Optional"
                                    className="w-full"
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <DollarSign size={14} className="text-blue-600" />
                                    Max Price
                                </label>
                                <Input
                                    type="number"
                                    id="maxPrice"
                                    value={productData?.maxPrice}
                                    placeholder="Optional"
                                    className="w-full"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Stock Quantity */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Boxes
                                        size={16}
                                        className="text-blue-600"
                                    />
                                    Stock Quantity
                                </label>
                                <Input
                                    type="number"
                                    id="stock"
                                    value={productData?.stock}
                                    placeholder="0"
                                    className="w-full"
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Box size={14} className="text-blue-600" />
                                    Low Stock
                                </label>
                                <Input
                                    type="number"
                                    id="lowStock"
                                    value={productData?.lowStock}
                                    placeholder="0"
                                    className="w-full"
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-[-10px]">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Layers size={14} className="text-blue-600" />
                                    Category
                                </label>
                                <Select
                                    placeholder="Select category"
                                    id="category"
                                    value={productData?.category}
                                    onChange={(value) =>
                                        handleChange({
                                            target: { id: "category", value },
                                        })
                                    }
                                    options={categories.map((cat) => ({
                                        label: cat.name,
                                        value: cat._id,
                                    }))}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="pt-2 border-t border-gray-100">
                            <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <Box size={14} className="text-blue-600" />
                                Product Badges & Tags
                            </label>
                            <div className="flex flex-wrap gap-4">
                                {["Featured", "New Arrival", "Best Seller", "Top Rated", "Special Offer"].map((badge) => (
                                    <label key={badge} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100">
                                        <input
                                            type="checkbox"
                                            checked={(productData?.badges || []).includes(badge)}
                                            onChange={() => handleBadgeToggle(badge)}
                                            className="rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                        {badge}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Dynamic Description Sections */}
                        <div className="pt-2 border-t border-gray-100">
                            <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <Layers size={14} className="text-blue-600" />
                                Details & Sections
                            </label>
                            <ProductDetailsBuilder
                                details={productData?.details || []}
                                onChange={(updatedDetails) =>
                                    setProductData((prev) => ({ ...prev, details: updatedDetails }))
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column - Image Upload & Actions */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Image Upload */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-700">
                                Product Image
                            </label>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-gray-600">
                                    Remove BG
                                </label>
                                <input
                                    type="checkbox"
                                    checked={productData?.isRemoveBg}
                                    onChange={(e) =>
                                        setProductData((pre) => ({
                                            ...pre,
                                            isRemoveBg: e.target.checked,
                                        }))
                                    }
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label
                                htmlFor="image"
                                className="group relative flex flex-col items-center justify-center w-full aspect-[2/1] border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-gray-50 transition-all cursor-pointer overflow-hidden"
                            >
                                <div className="text-center p-6">
                                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-50 transition-colors">
                                        <ImageIcon
                                            size={24}
                                            className="text-gray-400 group-hover:text-blue-600 transition-colors"
                                        />
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 mb-1">
                                        Upload Product Images
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        PNG, JPG, WEBP (Max 10MB) - Multi select allowed
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    id="image"
                                    hidden
                                    accept="image/*"
                                    multiple
                                    onChange={handleChange}
                                />
                            </label>

                            {/* Image Previews */}
                            {productData?.images && productData.images.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {productData.images.map((img, idx) => {
                                        let imgUrl = "";
                                        if (img instanceof File) {
                                            imgUrl = URL.createObjectURL(img);
                                        } else if (img.url) {
                                            imgUrl = img.url; // New format
                                        } else if (img.filePath) {
                                            imgUrl = `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${img.filePath}`;
                                        }

                                        return (
                                            <div key={idx} className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group bg-gray-50">
                                                <img src={imgUrl} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute top-1.5 right-1.5 bg-white/90 text-red-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 shadow-sm"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Legacy Single Image Preview */}
                            {(!productData?.images || productData.images.length === 0) && productData?.image && previewUrl && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                                        <img src={previewUrl} className="w-full h-full object-cover" alt="Legacy Preview" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <Button
                            type="submit"
                            disabled={
                                createProductLoading || updateProductLoading
                            }
                            className="w-full py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {createProductLoading || updateProductLoading ? (
                                <>
                                    <Loader
                                        className="animate-spin"
                                        size={18}
                                    />
                                    <span className="text-sm font-medium">
                                        {isEditing
                                            ? "Updating..."
                                            : "Creating..."}
                                    </span>
                                </>
                            ) : isEditing ? (
                                <>
                                    <Save size={18} />
                                    <span className="text-sm font-medium">
                                        Update Product
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    <span className="text-sm font-medium">
                                        Create Product
                                    </span>
                                </>
                            )}
                        </Button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="w-full py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;
