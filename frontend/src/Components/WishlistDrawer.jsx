import { X, Heart, Trash2, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleWishlist } from "../store/slices/wishlistSlice";
import { addToCart } from "../store/slices/cartSlice";
import { useRemoveFromWishlist } from "../api/hooks/user.api";
import { useEffect, useRef } from "react";
import { getImageUrl } from "../utils/imageHelper";
import { toast } from "react-toastify";

const WishlistDrawer = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const wishlistItems = useSelector((state) => state.wishlist.items || []);
    const drawerRef = useRef(null);
    const { removeFromWishlist } = useRemoveFromWishlist();

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Close on click outside
    const handleOutsideClick = (e) => {
        if (drawerRef.current && !drawerRef.current.contains(e.target)) {
            onClose();
        }
    };

    const handleRemoveItem = async (item) => {
        dispatch(toggleWishlist(item)); // Optimistic UI update
        try {
            const id = item._id || item.id;
            await removeFromWishlist(id);
            toast.info("Removed from wishlist");
        } catch {
            dispatch(toggleWishlist(item)); // Revert on failure
            toast.error("Failed to remove item");
        }
    };

    const handleAddToCart = (item) => {
        dispatch(addToCart({ ...item, quantity: 1 }));
        handleRemoveItem(item); // Optional: remove from wishlist after adding to cart
        toast.success("Added to cart!");
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity z-[90] ${
                    isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                }`}
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div
                ref={drawerRef}
                className={`fixed top-0 right-0 h-full w-[85%] max-w-[380px] bg-white shadow-2xl flex flex-col z-[100] transform transition-transform duration-300 ease-in-out ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        <Heart size={20} className="text-red-500 fill-red-500" />
                        <h2 className="text-lg font-bold text-gray-900 font-sans tracking-tight">Your Wishlist</h2>
                        <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                            {wishlistItems.length} items
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                        aria-label="Close wishlist"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Wishlist Items Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-5">
                    {wishlistItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-400">
                                <Heart size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Your wishlist is empty</h3>
                                <p className="text-sm text-gray-500 mt-1">Save items you love to shop later.</p>
                            </div>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate("/products");
                                }}
                                className="mt-4 px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-dark transition-colors cursor-pointer"
                            >
                                Browse Products
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {wishlistItems.map((item) => {
                                const effP = item.effectivePrice !== undefined && item.effectivePrice !== null
                                    ? Number(item.effectivePrice)
                                    : Number(item.price || 0);

                                return (
                                <div key={item._id || item.id} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-xl hover:border-red-200 transition-colors group relative">
                                    <button 
                                        onClick={() => handleRemoveItem(item)}
                                        className="absolute -top-2 -right-2 p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-full transition-all cursor-pointer shadow-sm opacity-0 group-hover:opacity-100"
                                        title="Remove from Wishlist"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center p-1">
                                        {item.image ? (
                                            <img
                                                src={getImageUrl(item.image)}
                                                alt={item.name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://placehold.co/100x100/EDF6E5/4d8d3a?text=Rx";
                                                }}
                                            />
                                        ) : (
                                            <Heart className="text-gray-300" size={24} />
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <Link to={`/product/${item._id || item.id}`} onClick={onClose} className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug hover:text-primary transition-colors">
                                            {item.name}
                                        </Link>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="font-mono text-sm font-bold text-primary-dark">
                                                Rs. {effP.toLocaleString()}
                                            </span>
                                            <button
                                                onClick={() => handleAddToCart(item)}
                                                className="w-8 h-8 flex items-center justify-center bg-primary-pale text-primary-dark hover:bg-primary hover:text-white rounded-lg transition-colors cursor-pointer"
                                                title="Add to Cart"
                                            >
                                                <ShoppingCart size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {wishlistItems.length > 0 && (
                    <div className="px-5 py-5 border-t border-gray-100 bg-gray-50 shrink-0">
                        <button
                            onClick={() => {
                                onClose();
                                navigate("/wishlist");
                            }}
                            className="w-full py-3.5 bg-white border border-gray-200 text-gray-800 hover:bg-gray-100 hover:border-gray-300 rounded-xl font-bold text-sm tracking-wide transition-colors cursor-pointer"
                        >
                            Open Full Wishlist
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default WishlistDrawer;
