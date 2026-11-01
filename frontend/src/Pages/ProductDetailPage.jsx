import { variantGallery } from "../utils/variantImages";
import { PageLoading } from "../Components/UI/PageLoading";
import { safeHtml } from "../utils/safeHtml";
import { FormField, FieldLabel, FieldControl } from "../UI/FormField";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    Heart,
    Check,
    ShoppingCart,
    Loader2,
    Minus,
    Plus,
    ChevronLeft,
    ChevronRight,
    Star,
    ShieldCheck,
    Truck,
    Clock,
    MessageSquare,
    Package,
} from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Breadcrumb from "../Components/Breadcrumb";
import {
    useGetProductById,
    useGetAllProducts
} from "../api/hooks/product.api";
import { getImageUrl, handleImageError } from "../utils/imageHelper";
import { useGetProductReviews, useAddReview } from "../api/hooks/review.api";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../store/slices/cartSlice";
import { toggleWishlist } from "../store/slices/wishlistSlice";
import { useGetWishlist, useAddToWishlist, useRemoveFromWishlist } from "../api/hooks/user.api";
import StarRating from "../Components/UI/StarRating";
import ProductCard from "../Components/ProductCard";
import { toast } from "react-toastify";

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: productData, loading: productLoading, error: productError } = useGetProductById(id);
    const product = productData?.product || null;

    const [quantity, setQuantity] = useState(1);
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
    const [activeTab, setActiveTab] = useState("SPECIFICATION");
    const [reviewFilter, setReviewFilter] = useState("all");
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");
    const [fbtIndex, setFbtIndex] = useState(0);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const { data: allProductsData } = useGetAllProducts({ limit: 12 });
    const allProducts = allProductsData?.products || [];
    const { reviews, loading: reviewsLoading } = useGetProductReviews(id);
    const { addReview, loading: submittingReview } = useAddReview();

    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { addToWishlist } = useAddToWishlist();
    const { removeFromWishlist } = useRemoveFromWishlist();
    const { data } = useGetWishlist();
    const wishlistItems = data?.wishlist || [];

    const reviewsSectionRef = useRef(null);

    const matchId = (item, prod) => {
        if (!item || !prod) return false;
        const aval = item._id || item.id || item;
        const bval = prod._id || prod.id || prod;
        return aval.toString() === bval.toString();
    };

    const isInWishlist = !!wishlistItems.find((item) => matchId(item, product));

    const fbtItems = useMemo(() => allProducts.filter(p => (p._id || p.id) !== id), [allProducts, id]);
    const relatedProducts = useMemo(() => allProducts.filter(p => (p._id || p.id) !== id).slice(0, 6), [allProducts, id]);

    const combinedReviews = useMemo(() => {
        return reviews && reviews.length > 0 ? reviews : [];
    }, [reviews]);

    const filteredReviews = useMemo(() => {
        if (reviewFilter === "all") return combinedReviews;
        const targetRating = Number(reviewFilter);
        return combinedReviews.filter((r) => Math.round(r.rating) === targetRating);
    }, [combinedReviews, reviewFilter]);

    // Review counts by star rating
    const ratingCounts = useMemo(() => {
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, total: combinedReviews.length };
        combinedReviews.forEach((r) => {
            const star = Math.max(1, Math.min(5, Math.round(r.rating || 5)));
            counts[star] = (counts[star] || 0) + 1;
        });
        return counts;
    }, [combinedReviews]);

    const avgRating = useMemo(() => {
        if (combinedReviews.length === 0) return 0;
        const sum = combinedReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
        return (sum / combinedReviews.length).toFixed(1);
    }, [combinedReviews]);

    const activeVariants = (product?.variants || []).filter((variant) => variant.active !== false);
    const selectedVariant = activeVariants[selectedVariantIndex] || null;
    const galleryImages = variantGallery(product, selectedVariant);
    const variantStockTotal = activeVariants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);
    const usesSharedStock = activeVariants.length > 0 && variantStockTotal === 0 && Number(product?.stock) > 0;
    const stockValue = Number(selectedVariant && !usesSharedStock ? selectedVariant.stock : product?.stock) || 0;
    const isOutOfStock = stockValue <= 0;

    const variantPrice = variant => {
        const price = Number(variant.price);
        const promotion = product?.promotion;
        if (promotion?.discountType === "PERCENTAGE") return Math.max(0, price * (1 - promotion.discountValue / 100));
        if (promotion?.discountType === "FIXED_AMOUNT") return Math.max(0, price - promotion.discountValue);
        return price;
    };
    const handleAddToCart = (itemToAdd = product, qty = quantity) => {
        if (itemToAdd !== product && (itemToAdd?.variants || []).some(variant => variant.active !== false)) { navigate(`/product/${itemToAdd._id || itemToAdd.id}`); return; }
        if (!itemToAdd || (itemToAdd === product && isOutOfStock)) return;
        const variant = itemToAdd === product ? selectedVariant : null;
        dispatch(addToCart({
            ...itemToAdd,
            quantity: qty,
            ...(variant ? {
                selectedVariant: variant,
                variantId: variant._id,
                variantName: variant.name,
                price: Number(variant.price),
                effectivePrice: variantPrice(variant),
                stock: stockValue,
                usesSharedStock,
                image: galleryImages[0]?.filePath || galleryImages[0]?.url || product?.image,
            } : {}),
        }));
        toast.success(`Added ${itemToAdd.name} to cart!`);
    };

    const handleWishlist = async (targetProduct = product) => {
        if (!targetProduct) return;
        const targetId = targetProduct._id || targetProduct.id;
        const isTargetInWishlist = !!wishlistItems.find((item) => matchId(item, targetProduct));

        try {
            if (isTargetInWishlist) {
                await removeFromWishlist(targetId);
            } else {
                await addToWishlist(targetId);
            }
        } catch {
            // Error is handled by mutation
        }
    };

    const handleAddReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.warn("Please log in to write a review");
            return;
        }
        if (newRating === 0) {
            toast.warn("Please select a rating");
            return;
        }
        if (!newComment.trim()) {
            toast.warn("Please enter your review comment");
            return;
        }
        const res = await addReview({
            productId: id,
            rating: newRating,
            comment: newComment,
        });
        if (res?.success) {
            setNewComment("");
            setNewRating(5);
            setShowReviewForm(false);
        }
    };

    const scrollToReviews = () => {
        reviewsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    };



    const effectivePrice = selectedVariant ? variantPrice(selectedVariant) : product?.effectivePrice ?? product?.price;
    const originalPrice = selectedVariant ? Number(selectedVariant.price) : product?.price;
    const isDiscounted = effectivePrice < originalPrice;

    const breadcrumbItems = [
        { label: "Home", path: "/" },
        { label: "Products", path: "/products" },
        {
            label: product?.category?.name || "Products",
            path: `/products?category=${product?.category?._id || ""}`,
        },
        { label: product?.name || "Product" },
    ];

    const tabList = useMemo(() => {
        if (product?.details && product.details.length > 0) {
            return product.details.map((detail, idx) => ({
                id: `dynamic-section-${idx}`,
                label: detail.title.toUpperCase(),
            }));
        }
        return [{ id: "product-information", label: "PRODUCT INFORMATION" }];
    }, [product]);

    useEffect(() => {
        if (tabList.length > 0 && !tabList.find(t => t.id === activeTab)) {
            // eslint-disable-next-line
            setActiveTab(tabList[0].id);
        }
    }, [tabList, activeTab]);

    // Carousel navigation for More from our catalog
    const maxFbtIndex = Math.max(0, fbtItems.length - 2);
    const prevFbt = () => setFbtIndex((prev) => Math.max(0, prev - 1));
    const nextFbt = () => setFbtIndex((prev) => Math.min(maxFbtIndex, prev + 1));
    const visibleFbt = fbtItems.slice(fbtIndex, fbtIndex + 2);

    if (productLoading || (!product && !productError)) return <PageLoading variant="product" />;

    if (productError || !product) return <p role="alert" className="p-8">Could not load this product. <Link to="/products">Browse products</Link></p>;

    return (
        <div className="bg-surface min-h-screen text-[#1F2937] font-sans pb-16 selection:bg-primary/20 selection:text-primary-dark">
            {/* Main Container */}
            <div className="site-shell pt-8 sm:pt-9 lg:pt-10 pb-5">
                {/* Breadcrumbs */}
                <div className="text-xs sm:text-sm text-gray-500 mb-6 lg:mb-7">
                    <Breadcrumb items={breadcrumbItems} />
                </div>

                {/* Top Section: Main Product + Buy Info + Frequently Bought Together */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Left Column: Product Image Showcase */}
                    <div className="lg:col-span-4 h-full bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs relative flex flex-col items-center min-h-[420px] group">
                        {/* Wishlist Button */}
                        <button
                            onClick={() => handleWishlist(product)}
                            aria-label="Add to Wishlist"
                            className={`absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 shadow-xs border ${isInWishlist
                                    ? "bg-red-50 text-red-500 border-red-200"
                                    : "bg-white text-gray-400 hover:text-red-500 border-gray-200 hover:border-red-200"
                                }`}
                        >
                            <Heart
                                size={18}
                                fill={isInWishlist ? "currentColor" : "none"}
                            />
                        </button>

                        {/* Product Image */}
                        <div className="w-full flex-1 flex flex-col items-center justify-center overflow-hidden min-h-0">
                            {(() => {
                                const images = galleryImages;
                                const displayImageIndex = activeImageIndex;
                                const mainImage = images[displayImageIndex] || images[0];

                                return mainImage ? (
                                    <div className="w-full h-[260px] sm:h-[290px] flex items-center justify-center">
                                        <img
                                            src={mainImage.url || `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${mainImage.filePath}`}
                                            alt={product?.name}
                                            onError={(e) => handleImageError(e, "product")}
                                            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-[260px] sm:h-[290px] flex items-center justify-center">
                                        <div className="w-48 h-48 rounded-xl bg-[#F4F8EE] flex flex-col items-center justify-center text-[#74AA34]">
                                            <ShieldCheck size={48} className="stroke-[1.5]" />
                                            <span className="text-xs font-semibold mt-2">Product image unavailable</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Thumbnails */}
                            {(galleryImages.length > 1) && (
                                <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 w-full justify-center">
                                    {galleryImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            type="button" aria-label={`View image ${idx + 1} for ${selectedVariant?.name || product.name}`} aria-pressed={activeImageIndex === idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden ${activeImageIndex === idx ? "border-[#74AA34]" : "border-gray-100 hover:border-gray-300"
                                                }`}
                                        >
                                            <img
                                                src={img.url || `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${img.filePath}`}
                                                alt={`Thumbnail ${idx}`}
                                                onError={(e) => handleImageError(e, "product")}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Security Tag */}
                        <div className="mt-4 shrink-0 flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                            <ShieldCheck size={14} className="text-[#74AA34]" />
                            <span>100% Genuine & Sealed Packaging</span>
                        </div>
                    </div>

                    {/* Middle Column: Product Details & Purchase Actions */}
                    <div className="lg:col-span-4 h-full min-h-[420px] bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                        <div>
                            {/* Badges */}
                            {product?.badges && product.badges.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {product.badges.map((badge, idx) => (
                                        <span key={idx} className="bg-[#EDF6E5] text-[#3E6913] text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[#CDE5B7]">
                                            {badge}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Product Title & Status */}
                            <div className="flex items-start justify-between gap-4 mb-2.5">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
                                    {product.name}
                                </h1>
                                {isOutOfStock && (
                                    <span className="shrink-0 bg-red-100 text-red-600 font-bold text-xs px-2.5 py-1 rounded-md border border-red-200 mt-1">
                                        Out of Stock
                                    </span>
                                )}
                            </div>

                            {/* Ratings & Reviews Link */}
                            <div className="flex items-center gap-2 mb-3.5">
                                <StarRating
                                    rating={Number(avgRating)}
                                    readonly
                                    size={16}
                                    activeColor="text-[#74AA34]"
                                    inactiveColor="text-gray-200"
                                />
                                <button
                                    onClick={scrollToReviews}
                                    className="text-xs font-semibold text-[#74AA34] hover:underline cursor-pointer"
                                >
                                    {combinedReviews.length ? `(${combinedReviews.length} reviews)` : "No reviews yet"}
                                </button>
                            </div>

                            {/* Brand Line */}
                            <div className="text-xs sm:text-sm text-gray-600 mb-4 flex items-center gap-4 flex-wrap">
                                {product?.vendor && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg shrink-0">
                                        <Package size={14} className="text-gray-400" />
                                        <span className="text-xs font-bold text-gray-700 tracking-wide">
                                            {typeof product.vendor === 'object' ? product.vendor.name : product.vendor}
                                        </span>
                                    </div>
                                )}
                                {product?.productType && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-medium text-gray-500">Type:</span>
                                        <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs">
                                            {product.productType}
                                        </span>
                                    </div>
                                )}
                                {!product?.vendor && !product?.productType && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-medium text-gray-500">Brand:</span>
                                        <span className="font-semibold text-[#74AA34] bg-[#F4F8EE] px-2 py-0.5 rounded text-xs">
                                            Generic
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Price Line */}
                            <div className="flex items-baseline gap-3 mb-4 pb-4 border-b border-gray-100">
                                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                                    Rs. {effectivePrice?.toLocaleString()}
                                </span>
                                {isDiscounted && !selectedVariant && (
                                    <span className="text-sm text-gray-400 line-through font-medium">
                                        Rs. {originalPrice?.toLocaleString()}
                                    </span>
                                )}
                            </div>

                            {/* In Stock Badge */}
                            {!isOutOfStock && <div className="mb-5">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3E6913] bg-[#EDF6E5] px-3 py-1 rounded-full border border-[#D5EAC3]">
                                    <Check size={14} className="stroke-[3] text-[#74AA34]" />
                                    In Stock
                                </span>
                            </div>}

                            <p className="mb-5 text-sm text-gray-600">Price is per listed item. Check the product packaging for pack contents.</p>
                            {/* Pack / Option Selector */}
                            {activeVariants.length > 0 && <div className="mb-5">
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Choose Variant:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {activeVariants.map((variant, variantIndex) => (
                                        <button
                                            key={variant._id || variant.name}
                                            type="button"
                                            onClick={() => { setSelectedVariantIndex(variantIndex); setActiveImageIndex(0); setQuantity(1); }}
                                            className={`text-xs font-semibold py-2 px-3 rounded-lg border transition-all text-center ${selectedVariantIndex === variantIndex
                                                    ? "bg-[#F4F8EE] border-[#74AA34] text-[#3E6913] shadow-xs"
                                                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                                }`}
                                        >
                                            <span className="block">{variant.name}</span>
                                            {variant.color && <span className="block text-[10px] opacity-70 mt-0.5">{variant.color}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            }
                        </div>

                        {/* Quantity Stepper & Add to Cart CTA */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-3">
                                {/* Quantity Stepper */}
                                <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-1">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={isOutOfStock}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isOutOfStock ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}
                                        aria-label="Decrease quantity"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-10 text-center font-bold text-sm text-gray-900">
                                        {isOutOfStock ? 0 : quantity}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const maxStock = stockValue || 1;
                                            if (quantity < maxStock) {
                                                setQuantity(quantity + 1);
                                            } else {
                                                toast.warning(`Only ${maxStock} items available in stock.`);
                                            }
                                        }}
                                        disabled={isOutOfStock}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isOutOfStock ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}
                                        aria-label="Increase quantity"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                {/* Add to Cart Button */}
                                <button
                                    onClick={() => handleAddToCart(product, quantity)}
                                    disabled={isOutOfStock}
                                    className={`flex-1 h-11 px-5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all ${
                                        isOutOfStock
                                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                            : "bg-[#74AA34] hover:bg-[#629329] active:bg-[#537E22] text-white hover:shadow cursor-pointer"
                                    }`}
                                >
                                    <ShoppingCart size={16} />
                                    {isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}
                                </button>
                            </div>

                            {/* Fast Delivery Info */}
                            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 px-1">
                                <span className="flex items-center gap-1">
                                    <Truck size={14} className="text-[#74AA34]" /> Express 2-Hour Delivery
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={14} className="text-[#74AA34]" /> Open 24/7
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Frequently Bought Together */}
                    <div className="lg:col-span-4 h-full min-h-[420px] bg-[#F4F8EE] rounded-2xl border border-[#E0EED2] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                                    More from our catalog
                                </h3>
                                {/* Navigation arrows */}
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={prevFbt}
                                        disabled={fbtIndex === 0}
                                        aria-label="Previous items"
                                        className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[#74AA34] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all"
                                    >
                                        <ChevronLeft size={15} />
                                    </button>
                                    <button
                                        onClick={nextFbt}
                                        disabled={fbtIndex >= maxFbtIndex}
                                        aria-label="Next items"
                                        className="w-7 h-7 rounded-full bg-[#74AA34] flex items-center justify-center text-white hover:bg-[#629329] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all"
                                    >
                                        <ChevronRight size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Mini Product Cards Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {visibleFbt.map((item) => {
                                    const isFbtInWishlist = !!wishlistItems.find((w) => matchId(w, item));
                                    return (
                                        <div
                                            key={item._id || item.id}
                                            className="bg-white rounded-xl border border-gray-200/80 p-3 flex flex-col justify-between shadow-2xs relative group"
                                        >
                                            {/* Wishlist Heart */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleWishlist(item);
                                                }}
                                                aria-label="Save item"
                                                className={`absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full transition-all ${isFbtInWishlist
                                                        ? "text-red-500 bg-red-50"
                                                        : "text-gray-300 hover:text-red-500 bg-white"
                                                    }`}
                                            >
                                                <Heart
                                                    size={13}
                                                    fill={isFbtInWishlist ? "currentColor" : "none"}
                                                />
                                            </button>

                                            {/* Mini Image */}
                                            <div className="w-full aspect-square max-h-[90px] flex items-center justify-center mb-2 overflow-hidden">
                                                {item.image ? (
                                                    <img
                                                        src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${item.image}`}
                                                        alt={item.name}
                                                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded bg-[#F4F8EE] flex items-center justify-center text-[#74AA34] font-bold text-xs">
                                                        Rx
                                                    </div>
                                                )}
                                            </div>

                                            {/* Name */}
                                            <h4 className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight mb-1.5 min-h-[28px]">
                                                {item.name}
                                            </h4>

                                            {/* Price */}
                                            <div className="mt-auto flex flex-col mb-2">
                                                <span className="text-xs font-bold text-gray-900">
                                                    Rs. {(item.effectivePrice || item.price)?.toLocaleString()}
                                                </span>
                                                {item.effectivePrice && item.effectivePrice < item.price && (
                                                    <span className="text-xs text-gray-400 line-through">
                                                        Rs. {item.price?.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Quick Add Button */}
                                            <button
                                                onClick={() => handleAddToCart(item, 1)}
                                                className="w-full py-1 text-xs font-bold uppercase rounded-md bg-[#EDF6E5] text-[#3E6913] hover:bg-[#74AA34] hover:text-white transition-colors border border-[#D5EAC3]"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bundle action */}
                        <div className="mt-4 pt-3 border-t border-[#DCECCA]">
                            <button
                                onClick={() => {
                                    handleAddToCart(product, 1);
                                    visibleFbt.forEach((it) => handleAddToCart(it, 1));
                                    toast.success("Bundle items added to cart!");
                                }}
                                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#74AA34] text-[#3E6913] hover:text-white font-bold text-xs uppercase tracking-wide border border-[#CDE5B7] transition-all shadow-2xs flex items-center justify-center gap-2"
                            >
                                <ShoppingCart size={14} />
                                Add {visibleFbt.length + 1} Items to Cart
                            </button>
                        </div>
                    </div>
                </div>

                {/* Middle Navigation Pill Filter Tabs */}
                <div className="mt-10 mb-8 border-b border-gray-200/80 pb-4 sticky top-16 bg-[#FAFBF9]/95 backdrop-blur-md z-20 pt-2">
                    <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1">
                        {tabList.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        const el = document.getElementById(tab.id.toLowerCase());
                                        if (el) {
                                            el.scrollIntoView({ behavior: "smooth", block: "start" });
                                        }
                                    }}
                                    className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all duration-200 shrink-0 border ${isActive
                                            ? "bg-[#74AA34] text-white border-[#74AA34] shadow-xs"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-[#74AA34] hover:text-[#74AA34]"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Specification & Medical Details Sections */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-10 shadow-xs space-y-10">
                    {product.details && product.details.length > 0 ? (
                        product.details.map((detail, idx) => (
                            <React.Fragment key={`dynamic-section-${idx}`}>
                                {idx > 0 && <div className="border-t border-gray-100" />}
                                <section id={`dynamic-section-${idx}`} className="space-y-4">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                        {detail.title}
                                    </h3>
                                    <div
                                        className="space-y-3 text-xs sm:text-sm text-gray-700 leading-relaxed max-w-none prose prose-sm prose-blue"
                                        dangerouslySetInnerHTML={{ __html: safeHtml(detail.contentHTML) }}
                                    />
                                </section>
                            </React.Fragment>
                        ))
                    ) : (
                        <section id="product-information" className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900">Product information</h3>
                            <p className="text-sm leading-relaxed text-gray-700">{product?.description || "Detailed product information is not available yet. Check the product packaging or contact our pharmacy team before ordering."}</p>
                            <Link to="/contact-us" className="inline-flex text-sm font-semibold text-primary-dark underline underline-offset-4">Ask about this product</Link>
                        </section>
                    )}
                </div>

                {/* Ratings & Reviews Section (Styled exactly matching the image) */}
                <div ref={reviewsSectionRef} className="mt-12 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-xl sm:text-2xl font-bold text-[#74AA34]">
                            Ratings & Reviews
                        </h2>

                        <button
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#74AA34] hover:bg-[#629329] text-white text-xs font-bold uppercase tracking-wider transition-all self-start shadow-xs cursor-pointer"
                        >
                            <MessageSquare size={15} />
                            {showReviewForm ? "Close Review Form" : "Write a Review"}
                        </button>
                    </div>

                    {/* Review Submission Form (Expandable) */}
                    {showReviewForm && (
                        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D5EAC3] shadow-xs">
                            <h4 className="text-base font-bold text-gray-900 mb-4">
                                Share Your Experience
                            </h4>
                            <form onSubmit={handleAddReviewSubmit} className="space-y-4">
                                <div>
                                    <p className="block text-sm font-semibold text-gray-700 mb-1.5">Your rating</p>
                                    <StarRating
                                        rating={newRating}
                                        setRating={setNewRating}
                                        size={22}
                                        activeColor="text-[#74AA34]"
                                        inactiveColor="text-gray-200"
                                    />
                                </div>

                                <FormField>
                                    <FieldLabel className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Review Details
                                    </FieldLabel>
                                    <FieldControl as="textarea"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        rows={3}
                                        placeholder="Write your thoughts about product authenticity, packaging, or delivery..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#74AA34]/30 focus:border-[#74AA34] outline-none transition-all"
                                        required
                                    />
                                </FormField>

                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="px-6 py-2.5 bg-[#74AA34] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#629329] disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    {submittingReview ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Review"
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Ratings Breakdown Summary Card */}
                    <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                            {/* Score Box */}
                            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-gray-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-4xl sm:text-5xl font-black text-gray-900">
                                        {combinedReviews.length ? avgRating : "—"}
                                    </span>
                                    <span className="bg-[#74AA34] text-white text-xs font-bold px-2.5 py-1 rounded-md">
                                        Review
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <StarRating
                                        rating={Number(avgRating)}
                                        readonly
                                        size={20}
                                        activeColor="text-[#74AA34]"
                                        inactiveColor="text-gray-200"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 font-medium">
                                    {combinedReviews.length ? `Based on ${combinedReviews.length} customer reviews` : "No reviews yet"}
                                </p>
                            </div>

                            {/* Rating Progress Bars (5 Star to 1 Star) */}
                            <div className="md:col-span-8 space-y-2.5">
                                {[5, 4, 3, 2, 1].map((stars) => {
                                    const count = ratingCounts[stars] || 0;
                                    const percentage =
                                        ratingCounts.total > 0
                                            ? Math.round((count / ratingCounts.total) * 100)
                                            : stars === 5
                                                ? 80
                                                : 10;
                                    return (
                                        <div key={stars} className="flex items-center gap-3 text-xs">
                                            {/* Stars display */}
                                            <div className="flex items-center gap-0.5 w-20 shrink-0 text-[#74AA34]">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={13}
                                                        fill={i < stars ? "currentColor" : "none"}
                                                        className={i < stars ? "text-[#74AA34]" : "text-gray-200"}
                                                    />
                                                ))}
                                            </div>

                                            {/* Progress Bar (Pistachio Green Fill) */}
                                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#74AA34] rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%` }}
                                                />
                                            </div>

                                            {/* Count Number */}
                                            <span className="w-5 text-right font-semibold text-gray-700">
                                                {count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Star Rating Filter Pills */}
                        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2 sm:gap-3 flex-wrap">
                            <button
                                onClick={() => setReviewFilter("all")}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${reviewFilter === "all"
                                        ? "bg-[#74AA34] text-white border-[#74AA34]"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-[#74AA34]"
                                    }`}
                            >
                                ★ All ({combinedReviews.length})
                            </button>
                            {[5, 4, 3, 2, 1].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setReviewFilter(star.toString())}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${reviewFilter === star.toString()
                                            ? "bg-[#74AA34] text-white border-[#74AA34]"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-[#74AA34]"
                                        }`}
                                >
                                    ★ {star} ({ratingCounts[star] || 0})
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Review Cards List */}
                    <div className="space-y-3">
                        {reviewsLoading ? (
                            <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
                                <Loader2 className="animate-spin text-[#74AA34] mx-auto mb-2" size={28} />
                                <span className="text-xs text-gray-500">Loading reviews...</span>
                            </div>
                        ) : filteredReviews.length === 0 ? (
                            <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center">
                                <p className="text-xs text-gray-500">
                                    No reviews matching this star filter.
                                </p>
                            </div>
                        ) : (
                            filteredReviews.map((rev) => (
                                <div
                                    key={rev._id}
                                    className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-2 hover:border-[#D0E6BD] transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-[#EDF6E5] text-[#74AA34] flex items-center justify-center font-bold text-xs">
                                                {rev.name ? rev.name.charAt(0).toUpperCase() : "U"}
                                            </div>
                                            <div>
                                                <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                                                    {rev.name}
                                                </h4>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(rev.createdAt || "2024-01-01T00:00:00Z").toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <StarRating
                                            rating={rev.rating || 5}
                                            readonly
                                            size={14}
                                            activeColor="text-[#74AA34]"
                                            inactiveColor="text-gray-200"
                                        />
                                    </div>

                                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pt-1">
                                        {rev.comment}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Related Products Section */}
                <div className="mt-14 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#74AA34] rounded-full" />
                        <h2 className="text-xl sm:text-2xl font-bold text-[#74AA34]">
                            Related Products
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 auto-rows-fr items-stretch gap-4">
                        {relatedProducts.map((relProd) => (
                            <ProductCard
                                key={relProd._id || relProd.id}
                                product={relProd}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
