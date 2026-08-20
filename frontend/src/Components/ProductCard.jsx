import { Star, Heart, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../store/slices/cartSlice";
import { toggleWishlist } from "../store/slices/wishlistSlice";
import { useAddToWishlist, useRemoveFromWishlist } from "../api/hooks/user.api";
import { toast } from "react-toastify";

const ProductCard = ({ product }) => {
    const dispatch = useDispatch();
    const wishlistItems = useSelector((state) => state.wishlist.items || []);
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

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!product) return;
        dispatch(addToCart({ ...product, quantity: 1 }));
        toast.success(`${product?.name || "Product"} added to cart!`);
    };

    const handleWishlist = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!productId) return;

        dispatch(toggleWishlist(product));
        try {
            if (isInWishlist) {
                await removeFromWishlist(productId);
                toast.info("Removed from wishlist");
            } else {
                await addToWishlist(productId);
                toast.success("Added to wishlist");
            }
        } catch {
            dispatch(toggleWishlist(product));
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
        if (
            product?.promotion?.discountType === "PERCENTAGE" &&
            product?.promotion?.discountValue
        ) {
            discountBadgeText = `-${product.promotion.discountValue}%`;
        } else if (rawPrice > 0) {
            const pct = Math.round(((rawPrice - rawEffectivePrice) / rawPrice) * 100);
            discountBadgeText = `-${pct}%`;
        }
    }

    const ratingVal = Number(product?.rating || 5);
    const roundedRating = Math.min(5, Math.max(1, Math.round(ratingVal)));

    const getImageUrl = (img) => {
        if (!img) return "https://placehold.co/300x300/F4F8EE/74AA34?text=MediCare";
        if (img.startsWith("http://") || img.startsWith("https://")) return img;
        const endpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
        if (endpoint) {
            return `${endpoint.replace(/\/+$/, "")}/${img.replace(/^\/+/, "")}`;
        }
        return img;
    };

    const imageSrc = getImageUrl(product?.image);

    return (
        <div className="group relative flex flex-col h-full bg-white rounded-2xl border border-gray-200/85 hover:border-[#74AA34]/60 p-3 sm:p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_25px_rgba(116,170,52,0.12)] transition-all duration-300">
            {/* Top Image Box */}
            <div className="relative aspect-square w-full bg-[#FAFBF9] rounded-xl overflow-hidden border border-gray-100/90 mb-3 flex items-center justify-center">
                {/* Discount Badge */}
                {isDiscounted && (
                    <div className="absolute top-2 left-2 z-10 bg-rose-500 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs tracking-tight">
                        {discountBadgeText}
                    </div>
                )}

                {/* Wishlist Button */}
                <button
                    type="button"
                    onClick={handleWishlist}
                    aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    className={`absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer shadow-2xs ${
                        isInWishlist
                            ? "bg-rose-50 text-rose-500 border border-rose-200"
                            : "bg-white/90 backdrop-blur-xs text-gray-400 hover:text-rose-500 hover:bg-white border border-gray-200/80"
                    }`}
                >
                    <Heart
                        size={13}
                        fill={isInWishlist ? "currentColor" : "none"}
                    />
                </button>

                {/* Image Link */}
                <Link
                    to={`/product/${productId}`}
                    className="w-full h-full p-2.5 flex items-center justify-center"
                >
                    <img
                        src={imageSrc}
                        alt={product?.name || "Product"}
                        loading="lazy"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/300x300/F4F8EE/74AA34?text=MediCare";
                        }}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 ease-out"
                    />
                </Link>
            </div>

            {/* Content & Details */}
            <div className="flex flex-col flex-1 justify-between">
                <div>
                    {/* Rating Row */}
                    <div className="flex items-center gap-1.5 mb-1.5 h-4">
                        <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={11}
                                    fill={i < roundedRating ? "currentColor" : "none"}
                                    className={
                                        i < roundedRating
                                            ? "text-amber-400"
                                            : "text-gray-200"
                                    }
                                />
                            ))}
                        </div>
                        <span className="font-mono text-[11px] font-medium text-gray-400 leading-none">
                            ({ratingVal.toFixed(1)})
                        </span>
                    </div>

                    {/* Product Title (enlarged font with more space beneath) */}
                    <Link
                        to={`/product/${productId}`}
                        title={product?.name}
                        className="font-sans text-gray-900 font-bold text-[13px] sm:text-sm leading-snug line-clamp-2 h-[42px] hover:text-[#74AA34] transition-colors mb-3.5 block"
                    >
                        {product?.name || "Healthcare Product"}
                    </Link>
                </div>

                {/* Footer Section (Price & Action) */}
                <div className="mt-auto pt-1 flex flex-col gap-2.5">
                    {/* Price Slot - fixed height 34px */}
                    <div className="h-[34px] flex flex-col justify-center">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="font-mono text-sm sm:text-base font-bold text-gray-900 leading-none">
                                Rs. {displayPrice?.toLocaleString()}
                            </span>
                            {strikePrice && (
                                <span className="font-mono text-[11px] text-gray-400 line-through leading-none">
                                    Rs. {strikePrice?.toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        className="w-full flex items-center justify-center gap-1.5 bg-[#74AA34] hover:bg-[#629329] active:bg-[#527E23] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider h-9 rounded-xl transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
                    >
                        <ShoppingCart size={13} className="shrink-0" />
                        <span>Add to Cart</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;