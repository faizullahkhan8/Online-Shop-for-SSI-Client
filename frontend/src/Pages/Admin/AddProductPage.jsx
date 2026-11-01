import { remapVariantAfterImageRemoval } from "../../utils/variantImages";
import { Link } from "react-router-dom";
import { QueryError } from "../../UI/QueryState";
import ProductVariantsEditor from "../../Components/Admin/ProductVariantsEditor";
import { PageLoading } from "../../Components/UI/PageLoading";
/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import Input from "../../UI/Input.jsx";
import Button from "../../UI/Button.jsx";
import Select from "../../UI/Select.jsx";
import ProductDetailsBuilder from "../../Components/ProductDetailsBuilder.jsx";
import {
    ImageIcon,
    ChevronLeft,
    ChevronRight,
    Loader,
    Plus,
    Save,
    X,
    Hash,
    Layers,
    DollarSign,
    Box,
    Boxes,
    Wand2,
} from "lucide-react";
import {
    useCreateProuduct,
    useUpdateProduct,
    useProductForEdit,
} from "../../api/hooks/product.api.js";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useGetAllCategories } from "../../api/hooks/category.api.js";
import { useGetAllVendors } from "../../api/hooks/vendor.api.js";

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
    hasVariants: false,
    variants: [],
    badges: [],
    image: null,
    images: [],
    isRemoveBg: false,
};

const AddProduct = () => {
    const { id } = useParams();
    const [params] = useSearchParams();
    // Old bookmarked edit links are converted to an ID-only route; their fields are ignored.
    if (!id && (params.has("product") || params.get("isEditing") === "true")) {
        let legacyId;
        try { legacyId = JSON.parse(params.get("product"))?._id; } catch { /* Invalid legacy URL. */ }
        if (typeof legacyId === "string" && /^[a-f0-9]{24}$/i.test(legacyId)) return <Navigate to={`/admin-dashboard/products/${legacyId}/edit`} replace />;
        return <QueryError message="This edit link is invalid. Open the product from the products list." />;
    }
    if (id && !/^[a-f0-9]{24}$/i.test(id)) return <QueryError message="Invalid product ID. Open the product from the products list." />;
    return <ProductForm key={id || "new"} productId={id || null} />;
};

const ProductForm = ({ productId }) => {
    const navigate = useNavigate();
    const [productData, setProductData] = useState(INITAIL_STATE);
    const isEditing = Boolean(productId);
    const hydratedProduct = useRef(null);
    const galleryRef = useRef(null);
    const imageInputRef = useRef(null);
    const { data: currentProduct, loading: productLoading, error: productError, refetch: refetchProduct } = useProductForEdit(productId);
    useEffect(() => {
        const fresh = currentProduct?.product;
        if (!productLoading && fresh && fresh._id === productId && hydratedProduct.current !== fresh._id) {
            hydratedProduct.current = fresh._id;
            setProductData(prev => ({ ...prev, ...fresh, category: fresh.category?._id || fresh.category || "", vendor: fresh.vendor?._id || fresh.vendor || "" }));
        }
    }, [currentProduct, productId, productLoading]);
    const reloadProduct = async () => {
        const result = await refetchProduct();
        if (result.error) { toast.error(result.error.response?.data?.message || "Could not reload the product. Your unsaved changes are still here."); return; }
        const response = result.data;
        if (response?.product) setProductData(prev => ({ ...prev, ...response.product, category: response.product.category?._id || response.product.category || "", vendor: response.product.vendor?._id || response.product.vendor || "" }));
    };


    const { data: categoriesData, loading: categoriesLoading } = useGetAllCategories();
    const categories = categoriesData?.categories || [];
    const [vendors, setVendors] = useState([]);
    const [previewUrl, setPreviewUrl] = useState("");

    const { createProduct, loading: createProductLoading } =
        useCreateProuduct();
    const { updateProduct, loading: updateProductLoading } = useUpdateProduct();

    const { data: vendorsData, loading: vendorsLoading } = useGetAllVendors();

    useEffect(() => {
        if (vendorsData?.success) {
            setVendors(vendorsData.vendors);
        }
    }, [vendorsData]);

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
            const newFiles = Array.from(files || []);
            e.target.value = "";
            if (!newFiles.length) return;
            if (newFiles.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
                toast.error("Choose JPG, PNG or WebP images up to 5 MB each.");
                return;
            }
            if ((productData.images || []).filter(image => image instanceof File).length + newFiles.length > 5) {
                toast.error("You can upload up to 5 new images per save. Save these before adding more.");
                return;
            }
            setProductData((prev) => ({
                ...prev,
                images: [...(prev.images || []), ...newFiles]
            }));
        } else {
            setProductData((prev) => {
                const updated = { ...prev, [id]: value };
                if (id === "name" && !isEditing) {
                    updated.slug = value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)+/g, "");
                }
                return updated;
            });
        }
    };

    const removeImage = (index) => {
        setProductData((prev) => {
            const newImages = [...(prev.images || [])];
            newImages.splice(index, 1);
            return { ...prev, images: newImages, variants: (prev.variants || []).map(variant => remapVariantAfterImageRemoval(variant, index, prev.images.length)) };
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

    const addVariant = () => {
        setProductData((prev) => ({
            ...prev,
            hasVariants: true,
            variants: [...(prev.variants || []), {
                _editorKey: crypto.randomUUID(),
                name: "", color: "", sku: "", price: prev.price || "",
                stock: 0, lowStock: 5, imageIndex: 0, imageIndices: [],
                active: true,
            }],
        }));
    };

    const updateVariant = (index, field, value) => {
        setProductData((prev) => {
            const variants = [...(prev.variants || [])];
            variants[index] = { ...variants[index], [field]: value, ...(field === "imageIndices" ? { imageIndex: value[0] ?? 0 } : {}) };
            const active = variants.filter((variant) => variant.active !== false);
            const prices = active.map((variant) => Number(variant.price)).filter(Number.isFinite);
            const totalStock = active.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);
            return {
                ...prev,
                variants,
                price: prices.length ? Math.min(...prices) : prev.price,
                stock: totalStock,
            };
        });
    };

    const removeVariant = (index) => {
        setProductData((prev) => {
            const variants = (prev.variants || []).filter((_, variantIndex) => variantIndex !== index);
            const active = variants.filter((variant) => variant.active !== false);
            const prices = active.map((variant) => Number(variant.price)).filter(Number.isFinite);
            return {
                ...prev,
                variants,
                hasVariants: variants.length > 0,
                price: prices.length ? Math.min(...prices) : prev.price,
                stock: active.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0),
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();

        const { image, images, ...textData } = productData;
        const newImages = images?.filter((img) => img instanceof File) || [];
        const existingImages = images?.filter((img) => !(img instanceof File)) || [];

        textData.images = existingImages;
        textData.variants = (textData.variants || []).map(({ _editorKey, ...variant }) => variant);
        if (isEditing) {
            delete textData.stock;
            textData.revision = productData.revision || 0;
            textData.variants = (textData.variants || []).map(variant => {
                if (!variant._id) return variant;
                const { stock: _stock, ...catalogVariant } = variant;
                return catalogVariant;
            });
        }

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
            if (response?.success) navigate("/admin-dashboard/products");
        } else {
            const response = await updateProduct({
                product: formData,
                id: productData._id,
            });
            if (response?.success)
                navigate("/admin-dashboard/products");
        }
    };

    if (isEditing && productError && !productData._id) return <QueryError message={productError.response?.data?.message || "Could not load the product. Please try again."} onRetry={() => refetchProduct()} />;
    if (categoriesLoading || vendorsLoading || (isEditing && !productData._id)) return <PageLoading variant="form" />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-display text-gray-900">
                        {isEditing ? "Edit Product" : "Add New Product"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {isEditing
                            ? "Update product information"
                            : "Create a new product listing"}
                    </p>
                </div>
                <button aria-label="Close"
                    onClick={() => navigate(-1)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                    <X size={20} />
                </button>
            </header>

            {isEditing && <button type="button" onClick={reloadProduct} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm">Reload saved product (discard unsaved edits)</button>}
            {isEditing && <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">Stock is managed separately. Use <Link to="/admin-dashboard/products" className="font-semibold text-primary-dark underline underline-offset-2">Adjust stock in All Products</Link> to record inventory changes.</p>}
            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
                {/* Left Column - Product Details */}
                <div className="min-w-0 lg:col-span-7 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-colors duration-200 space-y-5">
                        {/* Product Name */}
                        <div>
                            <label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                <Hash size={14} className="text-primary" />
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
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="slug" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Hash size={14} className="text-primary" />
                                        Slug (URL)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!productData?.name) return toast.warn("Please enter a product name first");
                                            const generated = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
                                            setProductData(prev => ({ ...prev, slug: generated }));
                                        }}
                                        className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-1 bg-primary-pale px-2 py-0.5 rounded transition-colors"
                                    >
                                        <Wand2 size={12} />
                                        Auto-generate
                                    </button>
                                </div>
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
                                <label htmlFor="vendor" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Box size={14} className="text-primary" />
                                    Vendor
                                </label>
                                <Select
                                    id="vendor"
                                    value={productData?.vendor?._id || productData?.vendor || ""}
                                    onChange={(value) =>
                                        handleChange({
                                            target: { id: "vendor", value },
                                        })
                                    }
                                    options={[
                                        { value: "", label: "Select Vendor" },
                                        ...vendors.map((v) => ({
                                            value: v._id,
                                            label: v.name,
                                        })),
                                    ]}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Product Type & Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Layers size={14} className="text-primary" />
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

                        <ProductVariantsEditor variants={productData.variants || []} images={productData.images || []} isEditing={isEditing}
                            onAdd={addVariant} onChange={updateVariant} onRemove={removeVariant} />

                        {/* Pricing */}
                        {(productData.variants || []).length === 0 && (
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="price" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <DollarSign
                                        size={14}
                                        className="text-primary"
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
                        </div>
                        )}

                        {/* Stock Quantity */}
                        <div className="grid grid-cols-2 gap-4">
                            {["minPrice", "maxPrice"].map(field => <div key={field}><label htmlFor={field} className="block text-sm font-medium mb-1.5">{field === "minPrice" ? "Min Price" : "Max Price"}</label><Input id={field} type="number" min="0" step="0.01" value={productData[field] ?? ""} placeholder="Optional" onChange={handleChange} /></div>)}
                        </div>
                        <div className={`grid ${(productData.variants || []).length === 0 ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
                            {(productData.variants || []).length === 0 && (
                            <div>
                                <label htmlFor="stock" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Boxes
                                        size={16}
                                        className="text-primary"
                                    />
                                    Stock Quantity
                                </label>
                                <Input
                                    type="number"
                                    id="stock"
                                    readOnly={isEditing}
                                    value={productData?.stock}
                                    placeholder="0"
                                    className="w-full"
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            )}
                            <div>
                                <label htmlFor="lowStock" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Box size={14} className="text-primary" />
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
                                <label htmlFor="category" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Layers size={14} className="text-primary" />
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
                                <Box size={14} className="text-primary" />
                                Product Badges & Tags
                            </label>
                            <div className="flex flex-wrap gap-4">
                                {["Featured", "New Arrival", "Best Seller", "Top Rated", "Special Offer"].map((badge) => (
                                    <label key={badge} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100">
                                        <input
                                            type="checkbox"
                                            checked={(productData?.badges || []).includes(badge)}
                                            onChange={() => handleBadgeToggle(badge)}
                                            className="rounded text-primary border-gray-300 focus:ring-primary"
                                        />
                                        {badge}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Dynamic Description Sections */}
                        <div className="pt-2 border-t border-gray-100">
                            <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <Layers size={14} className="text-primary" />
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
                <div className="min-w-0 space-y-6 lg:sticky lg:top-0 lg:col-span-5 lg:self-start">
                    {/* Image Upload */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-colors duration-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Product images</span>
                                <span aria-live="polite" aria-atomic="true" className="rounded-full bg-primary-pale px-2 py-0.5 text-xs font-semibold tabular-nums text-primary-dark">
                                    {productData.images?.length || (productData.image && previewUrl ? 1 : 0)} images
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="remove-background" className="text-xs font-medium text-gray-600">
                                    Remove BG
                                </label>
                                <input id="remove-background"
                                    type="checkbox"
                                    checked={productData?.isRemoveBg}
                                    onChange={(e) =>
                                        setProductData((pre) => ({
                                            ...pre,
                                            isRemoveBg: e.target.checked,
                                        }))
                                    }
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <button type="button" onClick={() => imageInputRef.current?.click()}
                                className="group flex min-h-24 w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary-pale/30 px-4 py-4 text-left transition-colors hover:border-primary hover:bg-primary-pale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary-dark"><ImageIcon size={22} aria-hidden="true" /></span>
                                <span className="min-w-0"><span className="block text-sm font-semibold text-primary-dark">{productData.images?.length ? "Add more images" : "Choose images"}</span><span className="mt-1 block text-xs text-gray-600">JPG, PNG, WebP · Up to 5 MB each</span></span>
                                <Plus size={20} className="shrink-0 text-primary-dark" aria-hidden="true" />
                            </button>
                            <input ref={imageInputRef} type="file" id="image" aria-label="Choose product images" hidden accept="image/jpeg,image/png,image/webp" multiple onChange={handleChange} />
                            <p className="text-xs leading-5 text-gray-500">Select multiple images together, or add them one by one. Up to 5 new images per save. Image numbers match the variant image selector.</p>

                            {/* Image Previews */}
                            {productData?.images && productData.images.length > 0 && (
                                <div className="min-w-0 space-y-2">
                                    {productData.images.length > 1 && <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs text-gray-500">Swipe or use the arrows to browse images.</p>
                                        <div className="flex shrink-0 gap-2">
                                            {[-1, 1].map(direction => <button key={direction} type="button" aria-label={direction < 0 ? "Previous product images" : "Next product images"}
                                                onClick={() => galleryRef.current?.scrollBy({ left: direction * Math.max(160, galleryRef.current.clientWidth * 0.8), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
                                                className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-primary-dark hover:bg-primary-pale focus-visible:outline-2 focus-visible:outline-primary-dark">
                                                {direction < 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                                            </button>)}
                                        </div>
                                    </div>}
                                <div ref={galleryRef} role="region" aria-label="Product image previews. Image numbers match the variant image selector." tabIndex={0}
                                    className="product-image-strip flex min-w-0 max-w-full snap-x snap-proximity gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-lg pb-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark">
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
                                            <figure key={idx} className="w-36 shrink-0 snap-start space-y-2 sm:w-40">
                                                <figcaption className="text-xs font-semibold tabular-nums text-gray-600">Image {idx + 1}</figcaption>
                                                <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                                <img src={imgUrl} className="h-full w-full object-contain" alt={`Product image ${idx + 1}`} />
                                                <button aria-label={`Remove image ${idx + 1}`}
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-lg bg-white/90 text-red-700 shadow-sm transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-primary-dark"
                                                >
                                                    <X size={14} />
                                                </button>
                                                </div>
                                            </figure>
                                        );
                                    })}
                                </div>
                                </div>
                            )}

                            {/* Legacy Single Image Preview */}
                            {(!productData?.images || productData.images.length === 0) && productData?.image && previewUrl && (
                                <figure className="w-36 space-y-2 sm:w-40">
                                    <figcaption className="text-xs font-semibold text-gray-600">Image 1</figcaption>
                                    <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                        <img src={previewUrl} className="h-full w-full object-contain" alt="Product image 1" />
                                    </div>
                                </figure>
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
                            className="w-full py-3 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
