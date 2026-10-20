import { Star, Heart, ShoppingCart, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/slices/cartSlice";
import { useGetWishlist, useAddToWishlist, useRemoveFromWishlist } from "../api/hooks/user.api";
import { toast } from "react-toastify";
import { getImageUrl, handleImageError } from "../utils/imageHelper";

const ProductCard = ({ product }) => {
    const dispatch = useDispatch();
    const { data } = useGetWishlist();
    const wishlistItems = data?.wishlist || [];
    const { addToWishlist } = useAddToWishlist();
    const { removeFromWishlist } = useRemoveFromWishlist();

    const productId = product?._id || product?.id;

    const matchId = (item, prod) => {
        if (!item || !prod) return false;
        const aval = item._id || item.id || item;
        const bval = prod._id || prod.id || prod;
        return aval.toString() === bval.toString();
    };

    const isInWishlist = !!wishlistItems.find((item) => matchId(item, product));

    const stock = Number(product?.stock) || 0;
    const isOutOfStock = stock <= 0;

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!product || isOutOfStock) return;
        dispatch(addToCart({ ...product, quantity: 1 }));
        toast.success(`${product?.name || "Product"} added to cart!`);
    };

    const handleWishlist = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!productId) return;

        try {
            if (isInWishlist) {
                await removeFromWishlist(productId);
                toast.info("Removed from wishlist");
            } else {
                await addToWishlist(productId);
                toast.success("Added to wishlist");
            }
        } catch {
            // Error is handled by mutation
        }
    };

    const rawPrice = Number(product?.price || 0);
    const rawEffectivePrice =
        product?.effectivePrice !== undefined && product?.effectivePrice !== null
            ? Number(product.effectivePrice)
            : rawPrice;

    const isDiscounted = rawEffectivePrice < rawPrice;
    const displayPrice = isDiscounted ? rawEffectivePrice : rawPrice;
    const strikePrice = isDiscounted ? rawPrice : null;

    let discountBadgeText = "SALE";
    if (isDiscounted) {
        if (product?.promotion?.discountType === "PERCENTAGE" && product?.promotion?.discountValue) {
            discountBadgeText = `-${product.promotion.discountValue}%`;
        } else if (rawPrice > 0) {
            const pct = Math.round(((rawPrice - rawEffectivePrice) / rawPrice) * 100);
            discountBadgeText = `-${pct}%`;
        }
    }

    const ratingVal = Number(product?.averageRating || 0);
    const hasRating = Number(product?.reviewCount) > 0 && ratingVal > 0;

    const imageSrc = getImageUrl(product?.image);

    // Get Brand or Category safely
    const getBrandOrCategory = () => {
        const vendorName = product?.vendor?.name || (typeof product?.vendor === 'string' ? product?.vendor : null);
        const categoryName = product?.category?.name || (typeof product?.category === 'string' ? product?.category : null);
        return vendorName || categoryName || "Zada Pick";
    };

    return (
        <div className="group relative flex flex-col h-full bg-white rounded-2xl border border-gray-200 hover:border-primary p-3 shadow-sm hover:shadow-md transition-all duration-300">
            {/* Top Image Box */}
            <div className={`relative aspect-square w-full bg-gray-50/80 rounded-2xl overflow-hidden mb-4 flex items-center justify-center transition-colors duration-300 ${!isOutOfStock ? "group-hover:bg-primary-pale/30" : "opacity-80"}`}>
                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
                        <span className="bg-red-500 text-white font-black text-xs uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm border border-white">
                            Out of Stock
                        </span>
                    </div>
                )}
                {/* Discount Badge */}
                {isDiscounted && (
                    <div className="absolute top-3 left-3 z-10 bg-amber-400 text-amber-900 font-black text-xs uppercase tracking-wider px-2 py-1 rounded-lg shadow-sm">
                        {discountBadgeText}
                    </div>
                )}

                {/* Wishlist Button */}
                <button
                    aria-label={`${isInWishlist ? "Remove" : "Save"} ${product?.name || "product"} ${isInWishlist ? "from" : "to"} wishlist`}
                    aria-pressed={isInWishlist}
                    onClick={handleWishlist}
                    className="absolute top-3 right-3 z-30 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all hover:scale-110 active:scale-95 cursor-pointer"
                >
                    <Heart
                        size={16}
                        className={isInWishlist ? "text-red-500 fill-red-500" : ""}
                    />
                </button>

                <Link
                    to={`/product/${productId}`}
                    className="w-full h-full flex items-center justify-center p-4"
                >
                    <img
                        src={imageSrc}
                        alt={product?.name || "Product"}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => handleImageError(e, "product")}
                    />
                </Link>
            </div>

            {/* Info Section */}
            <div className="flex flex-col flex-1 px-1.5 pb-1">
                {/* Brand & Rating Line */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 truncate pr-2 group-hover:text-primary transition-colors">
                        {getBrandOrCategory()}
                    </span>
                    {hasRating ? <div aria-label={`${ratingVal.toFixed(1)} out of 5 from ${product.reviewCount} reviews`} className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md">
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs font-black text-amber-600">
                            {ratingVal.toFixed(1)}
                        </span>
                    </div> : <span className="text-xs text-gray-500 whitespace-nowrap">No reviews</span>}
                </div>

                {/* Product Title */}
                <Link
                    to={`/product/${productId}`}
                    className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-3 group-hover:text-primary-dark transition-colors"
                    style={{ minHeight: '2.5rem' }}
                >
                    {product?.name || "Unnamed Product"}
                </Link>

                {/* Price & Action Button */}
                <div className="mt-auto flex items-end justify-between">
                    <div className="flex flex-col">
                        {strikePrice && (
                            <span className="text-xs font-bold text-gray-400 line-through leading-none mb-1">
                                Rs {strikePrice.toLocaleString()}
                            </span>
                        )}
                        <div className="flex items-baseline gap-1">
                            <span className="text-xs font-black text-primary uppercase tracking-wider">Rs</span>
                            <span className="text-lg font-black text-gray-900 leading-none group-hover:text-primary-dark transition-colors">
                                {displayPrice.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                            isOutOfStock 
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none" 
                            : "bg-primary-pale text-primary-dark hover:bg-primary hover:text-white hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                        }`}
                        aria-label={isOutOfStock ? `${product?.name}: Out of stock` : `Add ${product?.name} to cart`}
                        title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
                    >
                        <Plus size={20} strokeWidth={2.5} className={isOutOfStock ? "pointer-events-none" : ""} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
