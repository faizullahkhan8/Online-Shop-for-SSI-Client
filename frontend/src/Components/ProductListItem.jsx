import {
    Heart,
    Star,
    ShoppingCart,
    ArrowRight,
    ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../store/slices/cartSlice";
import { toggleWishlist } from "../store/slices/wishlistSlice";
import { useAddToWishlist, useRemoveFromWishlist } from "../api/hooks/user.api";
import { toast } from "react-toastify";

const ProductListItem = ({ product }) => {
    const dispatch = useDispatch();
    const wishlistItems = useSelector((state) => state.wishlist.items || []);
    const { addToWishlist } = useAddToWishlist();
    const { removeFromWishlist } = useRemoveFromWishlist();

    const productId = product?._id || product?.id;

    const matchId = (a, b) => {
        if (!a || !b) return false;
        const aval = a._id || a.id || a;
        const bval = b._id || b.id || b;
        return aval.toString() === bval.toString();
    };

    const isInWishlist = !!wishlistItems.find((i) => matchId(i, product));

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

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!product) return;
        dispatch(addToCart({ ...product, quantity: 1 }));
        toast.success(`${product?.name || "Product"} added to cart!`);
    };

    const rawPrice = Number(product?.price || 0);
    const rawEffectivePrice =
        product?.effectivePrice !== undefined && product?.effectivePrice !== null
            ? Number(product.effectivePrice)
            : rawPrice;

    const isDiscounted = rawEffectivePrice < rawPrice;
    const displayPrice = isDiscounted ? rawEffectivePrice : rawPrice;
    const strikePrice = isDiscounted ? rawPrice : null;

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
        <div className="group bg-white border border-gray-200/90 rounded-2xl p-4 flex flex-col md:flex-row gap-5 hover:border-[#74AA34]/50 hover:shadow-md transition-all relative">
            <div className="w-full md:w-48 h-48 bg-[#FAFBF9] rounded-xl flex-shrink-0 flex items-center justify-center relative p-3 overflow-hidden border border-gray-100/90">
                <Link to={`/product/${productId}`} className="w-full h-full flex items-center justify-center">
                    <img
                        src={imageSrc}
                        alt={product?.name || "Product"}
                        loading="lazy"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/300x300/F4F8EE/74AA34?text=MediCare";
                        }}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                </Link>
                <button
                    type="button"
                    onClick={handleWishlist}
                    aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        isInWishlist
                            ? "bg-rose-50 text-rose-500 border border-rose-200 shadow-2xs"
                            : "bg-white/90 text-gray-400 hover:text-rose-500 hover:bg-white shadow-2xs border border-gray-200"
                    }`}
                >
                    <Heart
                        size={13}
                        fill={isInWishlist ? "currentColor" : "none"}
                    />
                </button>
            </div>

            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#74AA34] bg-[#EDF6E5] px-2 py-0.5 rounded-md">
                                {product?.category?.name || "Healthcare"}
                            </span>
                            <Link to={`/product/${productId}`}>
                                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#74AA34] transition-colors mt-1">
                                    {product?.name || "Healthcare Product"}
                                </h3>
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-baseline gap-2">
                            <span className="font-mono text-lg font-bold text-gray-900">
                                Rs. {displayPrice?.toLocaleString()}
                            </span>
                            {strikePrice && (
                                <span className="font-mono text-xs text-gray-400 line-through">
                                    Rs. {strikePrice?.toLocaleString()}
                                </span>
                            )}
                        </div>
                        <div className="h-4 w-[1px] bg-gray-200" />
                        <div className="flex items-center gap-1.5">
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
                            <span className="font-mono text-xs font-semibold text-gray-600">
                                {ratingVal.toFixed(1)}
                            </span>
                        </div>
                    </div>

                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-4 max-w-xl">
                        {product?.description ||
                            "Authentic healthcare essential sourced directly from licensed pharmaceutical manufacturers with guaranteed quality."}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#EDF6E5] rounded-md border border-[#D5EAC3]">
                            <ShieldCheck
                                size={13}
                                className="text-[#74AA34]"
                            />
                            <span className="text-[11px] font-bold text-[#3E6913]">
                                100% Genuine
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                            In Stock
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            to={`/product/${productId}`}
                            className="flex items-center gap-1 text-xs font-bold text-[#74AA34] hover:text-[#3E6913] uppercase tracking-wider transition-colors group/link"
                        >
                            Details
                            <ArrowRight
                                size={12}
                                className="group-hover/link:translate-x-0.5 transition-transform"
                            />
                        </Link>
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            className="flex items-center gap-1.5 bg-[#74AA34] hover:bg-[#629329] active:bg-[#527E23] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
                        >
                            <ShoppingCart size={14} />
                            <span>Add to Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductListItem;