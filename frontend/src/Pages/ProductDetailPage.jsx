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
} from "lucide-react";
import { useParams, Link } from "react-router-dom";
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
import { useAddToWishlist, useRemoveFromWishlist } from "../api/hooks/user.api";
import StarRating from "../Components/UI/StarRating";
import ProductCard from "../Components/ProductCard";
import { toast } from "react-toastify";

const ProductDetailPage = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedPack, setSelectedPack] = useState("1 Strip (10 Tablets)");
    const [activeTab, setActiveTab] = useState("SPECIFICATION");
    const [reviewFilter, setReviewFilter] = useState("all");
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");
    const [fbtIndex, setFbtIndex] = useState(0);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const [allProducts, setAllProducts] = useState([]);

    const { getProductById, loading: productLoading } = useGetProductById();
    const { getAllProducts } = useGetAllProducts();
    const { getReviews, reviews, loading: reviewsLoading } = useGetProductReviews();
    const { addReview, loading: submittingReview } = useAddReview();

    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { addToWishlist } = useAddToWishlist();
    const { removeFromWishlist } = useRemoveFromWishlist();
    const wishlistItems = useSelector((state) => state.wishlist.items || []);

    const reviewsSectionRef = useRef(null);

    const matchId = (item, prod) => {
        if (!item || !prod) return false;
        const aval = item._id || item.id || item;
        const bval = prod._id || prod.id || prod;
        return aval.toString() === bval.toString();
    };

    const isInWishlist = !!wishlistItems.find((item) => matchId(item, product));

    // Fetch Product details & reviews
    useEffect(() => {
        if (id) {
            (async () => {
                const response = await getProductById(id);
                if (response?.success && response.product) {
                    setProduct(response.product);
                }
            })();
            getReviews(id);
        }
    }, [id]);

    // Fetch related products for "Frequently Bought Together" & "Related Products"
    useEffect(() => {
        (async () => {
            const response = await getAllProducts({ limit: 12 });
            if (response?.success && Array.isArray(response.products)) {
                setAllProducts(response.products);
            }
        })();
    }, []);

    // Frequently bought together items
    const fbtItems = useMemo(() => {
        const otherProducts = allProducts.filter((p) => (p._id || p.id) !== id);
        if (otherProducts.length >= 2) {
            return otherProducts;
        }
        // Fallback default bundle products if database has few products
        return [
            {
                _id: "fbt-1",
                name: "Panadol Extra Tablets 500mg/65mg (1 Strip)",
                price: 75,
                effectivePrice: 65,
                image: product?.image || "",
                brand: "GSK",
                rating: 5,
            },
            {
                _id: "fbt-2",
                name: "Disprin Tablets 300mg (1 Strip = 10 Tablets)",
                price: 55,
                effectivePrice: 48,
                image: product?.image || "",
                brand: "Reckitt",
                rating: 5,
            },
            {
                _id: "fbt-3",
                name: "Panadol CF Day & Night Tablets",
                price: 120,
                effectivePrice: 110,
                image: product?.image || "",
                brand: "GSK",
                rating: 4.8,
            },
        ];
    }, [allProducts, id, product]);

    // Related products
    const relatedProducts = useMemo(() => {
        const filtered = allProducts.filter((p) => (p._id || p.id) !== id);
        if (filtered.length > 0) return filtered.slice(0, 6);
        return [
            {
                _id: "rel-1",
                name: "Panadol Suspension 120ml (Strawberry Flavor)",
                price: 135,
                effectivePrice: 120,
                rating: 5,
                image: product?.image || "",
                sold: 45,
            },
            {
                _id: "rel-2",
                name: "Panadol Drops 20ml for Infants",
                price: 110,
                effectivePrice: 98,
                rating: 5,
                image: product?.image || "",
                sold: 62,
            },
            {
                _id: "rel-3",
                name: "Panadol Extra 500mg (2 Strips = 20 Tablets)",
                price: 150,
                effectivePrice: 130,
                rating: 5,
                image: product?.image || "",
                sold: 89,
            },
            {
                _id: "rel-4",
                name: "Panadol Baby & Infant Oral Suspension 60ml",
                price: 95,
                effectivePrice: 85,
                rating: 4.9,
                image: product?.image || "",
                sold: 30,
            },
            {
                _id: "rel-5",
                name: "Panadol Children's Syrup Paracetamol 100ml",
                price: 140,
                effectivePrice: 125,
                rating: 5,
                image: product?.image || "",
                sold: 74,
            },
        ];
    }, [allProducts, id, product]);

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

    const handleAddToCart = (itemToAdd = product, qty = quantity) => {
        if (!itemToAdd) return;
        dispatch(addToCart({ ...itemToAdd, quantity: qty }));
        toast.success(`Added ${itemToAdd.name} to cart!`);
    };

    const handleWishlist = async (targetProduct = product) => {
        if (!targetProduct) return;
        const targetId = targetProduct._id || targetProduct.id;
        const isTargetInWishlist = !!wishlistItems.find((item) => matchId(item, targetProduct));

        dispatch(toggleWishlist(targetProduct));
        try {
            if (isTargetInWishlist) {
                await removeFromWishlist(targetId);
            } else {
                await addToWishlist(targetId);
            }
        } catch {
            dispatch(toggleWishlist(targetProduct));
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
            getReviews(id);
        }
    };

    const scrollToReviews = () => {
        reviewsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    };



    const effectivePrice = product?.effectivePrice !== undefined ? product.effectivePrice : product?.price || 35;
    const originalPrice = product?.price || 35;
    const isDiscounted = product?.effectivePrice !== undefined && product?.effectivePrice < product?.price;

    const breadcrumbItems = [
        { label: "Home", path: "/" },
        { label: "Products", path: "/products" },
        {
            label: product?.category?.name || "Baby Care",
            path: `/products?category=${product?.category?.name || "all"}`,
        },
        { label: product?.name || "Panadol Tablets 500mg (1 Strip = 10 Tablets)" },
    ];

    const tabList = useMemo(() => {
        if (product?.details && product.details.length > 0) {
            return product.details.map((detail, idx) => ({
                id: `dynamic-section-${idx}`,
                label: detail.title.toUpperCase(),
            }));
        }
        return [
            { id: "SPECIFICATION", label: "SPECIFICATION" },
            { id: "USAGE_SAFETY", label: "USAGE AND SAFETY" },
            { id: "PRECAUTIONS", label: "PRECAUTIONS" },
            { id: "WARNINGS", label: "WARNINGS" },
            { id: "ADDITIONAL_INFO", label: "ADDITIONAL INFORMATION" },
        ];
    }, [product]);

    useEffect(() => {
        if (tabList.length > 0 && !tabList.find(t => t.id === activeTab)) {
            // eslint-disable-next-line
            setActiveTab(tabList[0].id);
        }
    }, [tabList, activeTab]);

    // Carousel navigation for Frequently Bought Together
    const maxFbtIndex = Math.max(0, fbtItems.length - 2);
    const prevFbt = () => setFbtIndex((prev) => Math.max(0, prev - 1));
    const nextFbt = () => setFbtIndex((prev) => Math.min(maxFbtIndex, prev + 1));
    const visibleFbt = fbtItems.slice(fbtIndex, fbtIndex + 2);

    if (productLoading) {
        return (
            <div className="w-full min-h-[70vh] flex flex-col items-center justify-center bg-white">
                <Loader2 className="animate-spin text-[#74AA34] mb-4" size={44} />
                <p className="text-sm font-semibold text-gray-600">
                    Loading medicine details...
                </p>
            </div>
        );
    }

    return (
        <div className="bg-[#FAFBF9] min-h-screen text-[#1F2937] font-sans pb-16 selection:bg-[#74AA34]/20 selection:text-[#3E6913]">
            {/* Main Container */}
            <div className="container mx-auto px-4 lg:px-8 py-5 max-w-[1240px]">
                {/* Breadcrumbs */}
                <div className="text-xs sm:text-sm text-gray-500 mb-5">
                    <Breadcrumb items={breadcrumbItems} />
                </div>

                {/* Top Section: Main Product + Buy Info + Frequently Bought Together */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Product Image Showcase */}
                    <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs relative flex flex-col items-center justify-center min-h-[380px] group">
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
                        <div className="w-full flex flex-col items-center justify-center overflow-hidden">
                            {(() => {
                                const images = product?.images?.length ? product.images : (product?.image ? [{ filePath: product.image }] : []);
                                const mainImage = images[activeImageIndex] || images[0];

                                return mainImage ? (
                                    <div className="w-full aspect-square max-h-[300px] flex items-center justify-center">
                                        <img
                                            src={mainImage.url || `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${mainImage.filePath}`}
                                            alt={product?.name}
                                            onError={(e) => handleImageError(e, "product")}
                                            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full aspect-square max-h-[300px] flex items-center justify-center">
                                        <div className="w-48 h-48 rounded-xl bg-[#F4F8EE] flex flex-col items-center justify-center text-[#74AA34]">
                                            <ShieldCheck size={48} className="stroke-[1.5]" />
                                            <span className="text-xs font-semibold mt-2">Authentic Medicine</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Thumbnails */}
                            {(product?.images?.length > 1) && (
                                <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 w-full justify-center">
                                    {product.images.map((img, idx) => (
                                        <button
                                            key={idx}
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
                        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                            <ShieldCheck size={14} className="text-[#74AA34]" />
                            <span>100% Genuine & Sealed Packaging</span>
                        </div>
                    </div>

                    {/* Middle Column: Product Details & Purchase Actions */}
                    <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                        <div>
                            {/* Badges */}
                            {product?.badges && product.badges.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {product.badges.map((badge, idx) => (
                                        <span key={idx} className="bg-[#EDF6E5] text-[#3E6913] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[#CDE5B7]">
                                            {badge}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Product Title */}
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-2.5">
                                {product?.name || "Panadol Tablets 500mg (1 Strip = 10 Tablets)"}
                            </h1>

                            {/* Ratings & Reviews Link */}
                            <div className="flex items-center gap-2 mb-3.5">
                                <StarRating
                                    rating={Number(avgRating) || 5}
                                    readonly
                                    size={16}
                                    activeColor="text-[#74AA34]"
                                    inactiveColor="text-gray-200"
                                />
                                <button
                                    onClick={scrollToReviews}
                                    className="text-xs font-semibold text-[#74AA34] hover:underline cursor-pointer"
                                >
                                    ({combinedReviews.length} Reviews)
                                </button>
                            </div>

                            {/* Brand Line */}
                            <div className="text-xs sm:text-sm text-gray-600 mb-4 flex items-center gap-4 flex-wrap">
                                {product?.vendor && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg shrink-0">
                                        <Box size={14} className="text-gray-400" />
                                        <span className="text-[11px] font-bold text-gray-700 tracking-wide">
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
                                    {product?.minPrice && product?.maxPrice
                                        ? `Rs. ${product.minPrice.toLocaleString()} - Rs. ${product.maxPrice.toLocaleString()}`
                                        : `Rs. ${effectivePrice?.toLocaleString()}`
                                    }
                                </span>
                                {isDiscounted && !product?.minPrice && (
                                    <span className="text-sm text-gray-400 line-through font-medium">
                                        Rs. {originalPrice?.toLocaleString()}
                                    </span>
                                )}
                            </div>

                            {/* In Stock Badge */}
                            <div className="mb-5">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3E6913] bg-[#EDF6E5] px-3 py-1 rounded-full border border-[#D5EAC3]">
                                    <Check size={14} className="stroke-[3] text-[#74AA34]" />
                                    In Stock
                                </span>
                            </div>

                            {/* Pack / Option Selector */}
                            <div className="mb-5">
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Available In:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["1 Strip (10 Tablets)", "Box (20 Strips)"].map((pack) => (
                                        <button
                                            key={pack}
                                            type="button"
                                            onClick={() => setSelectedPack(pack)}
                                            className={`text-xs font-semibold py-2 px-3 rounded-lg border transition-all text-center ${selectedPack === pack
                                                    ? "bg-[#F4F8EE] border-[#74AA34] text-[#3E6913] shadow-xs"
                                                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                                }`}
                                        >
                                            {pack}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quantity Stepper & Add to Cart CTA */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-3">
                                {/* Quantity Stepper */}
                                <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-1">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                                        aria-label="Decrease quantity"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-10 text-center font-bold text-sm text-gray-900">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                                        aria-label="Increase quantity"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                {/* Add to Cart Button (Pistachio Green) */}
                                <button
                                    onClick={() => handleAddToCart(product, quantity)}
                                    className="flex-1 bg-[#74AA34] hover:bg-[#629329] active:bg-[#537E22] text-white h-11 px-5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
                                >
                                    <ShoppingCart size={16} />
                                    ADD TO CART
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
                    <div className="lg:col-span-4 bg-[#F4F8EE] rounded-2xl border border-[#E0EED2] p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[380px]">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                                    Frequently Bought Together
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
                                            <h4 className="text-[11px] font-medium text-gray-800 line-clamp-2 leading-tight mb-1.5 min-h-[28px]">
                                                {item.name}
                                            </h4>

                                            {/* Price */}
                                            <div className="mt-auto flex flex-col mb-2">
                                                <span className="text-xs font-bold text-gray-900">
                                                    Rs. {(item.effectivePrice || item.price)?.toLocaleString()}
                                                </span>
                                                {item.effectivePrice && item.effectivePrice < item.price && (
                                                    <span className="text-[10px] text-gray-400 line-through">
                                                        Rs. {item.price?.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Quick Add Button */}
                                            <button
                                                onClick={() => handleAddToCart(item, 1)}
                                                className="w-full py-1 text-[10px] font-bold uppercase rounded-md bg-[#EDF6E5] text-[#3E6913] hover:bg-[#74AA34] hover:text-white transition-colors border border-[#D5EAC3]"
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
                                Add All 3 to Cart
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
                    {product?.details && product.details.length > 0 ? (
                        product.details.map((detail, idx) => (
                            <React.Fragment key={`dynamic-section-${idx}`}>
                                {idx > 0 && <div className="border-t border-gray-100" />}
                                <section id={`dynamic-section-${idx}`} className="space-y-4">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                        {detail.title}
                                    </h3>
                                    <div
                                        className="space-y-3 text-xs sm:text-sm text-gray-700 leading-relaxed max-w-none prose prose-sm prose-blue"
                                        dangerouslySetInnerHTML={{ __html: detail.contentHTML }}
                                    />
                                </section>
                            </React.Fragment>
                        ))
                    ) : (
                        <>
                            {/* Section 1: Specification */}
                            <section id="specification" className="space-y-4">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                    {product?.name || "Panadol Tablets 500mg (1 Strip = 10 Tablets)"} Specification
                                </h2>

                                <div className="space-y-3 text-xs sm:text-sm text-gray-700 leading-relaxed">
                                    <div>
                                        <span className="font-bold text-gray-900 block mb-0.5">
                                            Requires Prescription (YES/NO):
                                        </span>
                                        <span className="text-gray-600">No</span>
                                    </div>

                                    <div>
                                        <span className="font-bold text-gray-900 block mb-0.5">
                                            Generics:
                                        </span>
                                        <span className="text-[#74AA34] font-medium">Paracetamol</span>
                                    </div>

                                    <div>
                                        <span className="font-bold text-gray-900 block mb-0.5">
                                            Pack Size:
                                        </span>
                                        <span className="text-gray-600">{selectedPack}</span>
                                    </div>

                                    <div>
                                        <span className="font-bold text-gray-900 block mb-0.5">
                                            How It works:
                                        </span>
                                        <p className="text-gray-600 leading-relaxed">
                                            {product?.description ||
                                                "Panadol contains paracetamol, an analgesic and antipyretic agent that provides fast and effective relief of headaches, tension headache, migraine, toothache, muscle aches, backache, and fever associated with colds and flu. It acts predominantly by inhibiting prostaglandin synthesis in the central nervous system."}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <div className="border-t border-gray-100" />

                            {/* Section 2: Usage and Safety */}
                            <section id="usage_safety" className="space-y-4">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                    Usage And Safety
                                </h3>

                                <div className="space-y-3 text-xs sm:text-sm text-gray-700 leading-relaxed">
                                    <div>
                                        <span className="font-bold text-gray-900 block mb-0.5">Dosage:</span>
                                        <p className="text-gray-600">
                                            Adults and children aged 12 years and over: 1 to 2 tablets every 4 to 6 hours as required. Do not exceed 8 tablets in 24 hours. Children 6 to 11 years: Half to 1 tablet every 4 to 6 hours as required. Do not exceed 4 tablets in 24 hours. Not recommended for children under 6 years of age.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-gray-900 block mb-0.5">Side Effects:</span>
                                        <p className="text-gray-600">
                                            When taken at recommended doses, side effects are rare. Mild adverse reactions may include skin rash, allergic hypersensitivity, nausea, or epigastric distress. Discontinue use if any allergic reaction occurs.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-gray-900 block mb-0.5">Drug Interactions:</span>
                                        <p className="text-gray-600">
                                            Regular daily use of paracetamol may enhance the anticoagulant effect of warfarin and other coumarins, increasing bleeding risk. Concurrent use with other hepatotoxic medications or heavy alcohol consumption is not recommended.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-gray-900 block mb-0.5">Indications:</span>
                                        <p className="text-gray-600">
                                            Fast and effective treatment of mild to moderate pain including headache, migraine, toothache, dysmenorrhea, muscular aches, rheumatic pains, sore throat, and reducing fever.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-gray-900 block mb-0.5">When not to Use:</span>
                                        <p className="text-gray-600">
                                            Do not take if you have known hypersensitivity to paracetamol or any other ingredients in the product. Avoid if suffering from severe hepatic or renal impairment without medical supervision.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <div className="border-t border-gray-100" />

                            {/* Section 3: Precautions */}
                            <section id="precautions" className="space-y-3">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                    Precautions
                                </h3>
                                <div>
                                    <span className="font-bold text-gray-900 block mb-0.5">Precaution:</span>
                                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                        Contains paracetamol. Do not take with any other products containing paracetamol. Consult your healthcare professional if symptoms persist after 3 days or if your condition worsens. Keep out of sight and reach of children.
                                    </p>
                                </div>
                            </section>

                            <div className="border-t border-gray-100" />

                            {/* Section 4: Warnings */}
                            <section id="warnings" className="space-y-4">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                    Warnings
                                </h3>

                                <div className="space-y-3 text-xs sm:text-sm text-gray-700 leading-relaxed">
                                    <div>
                                        <span className="font-bold text-gray-900 block mb-0.5">Warning 1:</span>
                                        <p className="text-gray-600">
                                            Liver warning: This product contains paracetamol. Severe liver damage may occur if you take more than 4,000 mg of paracetamol in 24 hours, take with other drugs containing paracetamol, or consume 3 or more alcoholic drinks every day while using this product.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-gray-900 block mb-0.5">Warning 2:</span>
                                        <p className="text-gray-600">
                                            Allergy alert: Paracetamol may cause severe skin reactions. Symptoms may include skin reddening, blisters, and rash. If a skin reaction occurs, stop use and seek medical help immediately.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-gray-900 block mb-0.5">Warning 3:</span>
                                        <p className="text-gray-600">
                                            Overdose warning: In case of overdose, get medical help or contact a Poison Control Center immediately. Prompt medical attention is critical even if you do not notice any signs or symptoms.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <div className="border-t border-gray-100" />

                            {/* Section 5: Additional Information */}
                            <section id="additional_info" className="space-y-4">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                    Additional Information
                                </h3>

                                <div className="space-y-3 text-xs sm:text-sm text-gray-700 leading-relaxed">
                                    <div>
                                        <span className="font-bold text-gray-900 block mb-0.5">Pregnancy category:</span>
                                        <p className="text-gray-600">
                                            Category B. Always consult your doctor or healthcare professional before taking this medicine if you are pregnant or breastfeeding.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-gray-900 block mb-0.5">Storage (FREEZE / AMBIENT):</span>
                                        <p className="text-gray-600">
                                            Store below 25°C in a dry place away from heat, direct sunlight, and moisture. Do not freeze.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </>
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
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Your Rating
                                    </label>
                                    <StarRating
                                        rating={newRating}
                                        setRating={setNewRating}
                                        size={22}
                                        activeColor="text-[#74AA34]"
                                        inactiveColor="text-gray-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Review Details
                                    </label>
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        rows={3}
                                        placeholder="Write your thoughts about product authenticity, packaging, or delivery..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#74AA34]/30 focus:border-[#74AA34] outline-none transition-all"
                                        required
                                    />
                                </div>

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
                                        {Math.round(Number(avgRating)) || 5}
                                    </span>
                                    <span className="bg-[#74AA34] text-white text-xs font-bold px-2.5 py-1 rounded-md">
                                        Review
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <StarRating
                                        rating={Number(avgRating) || 5}
                                        readonly
                                        size={20}
                                        activeColor="text-[#74AA34]"
                                        inactiveColor="text-gray-200"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 font-medium">
                                    Based on {combinedReviews.length} verified ratings
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
                                                <span className="text-[11px] text-gray-400">
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

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
