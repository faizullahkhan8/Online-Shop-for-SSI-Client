import { X, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { removeFromCart, updateQuantity, clearCart } from "../store/slices/cartSlice";
import { useEffect, useRef } from "react";
import { getImageUrl } from "../utils/imageHelper";

const CartDrawer = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const cartItems = useSelector((state) => state.cart.items || []);
    const drawerRef = useRef(null);

    // Calculate total price accurately based on Redux structure
    const totalAmount = cartItems.reduce((acc, item) => acc + (item.totalPrice || (item.price * item.quantity)), 0);

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

    const handleQuantityChange = (id, currentQty, delta) => {
        const newQty = currentQty + delta;
        if (newQty > 0) {
            dispatch(updateQuantity({ _id: id, quantity: newQty }));
        }
    };

    const handleRemoveItem = (id) => {
        dispatch(removeFromCart({ _id: id }));
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
                        <ShoppingCart size={20} className="text-primary" />
                        <h2 className="text-lg font-bold text-gray-900 font-sans tracking-tight">Your Cart</h2>
                        <span className="bg-primary-pale text-primary-dark text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                            {cartItems.length} items
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                        aria-label="Close cart"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Cart Items Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-5">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-primary-pale rounded-full flex items-center justify-center text-primary-dark">
                                <ShoppingCart size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Your cart is empty</h3>
                                <p className="text-sm text-gray-500 mt-1">Looks like you haven't added anything yet.</p>
                            </div>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate("/products");
                                }}
                                className="mt-4 px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-dark transition-colors cursor-pointer"
                            >
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cartItems.map((item) => (
                                <div key={item._id} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-light transition-colors group relative">
                                    <button 
                                        onClick={() => handleRemoveItem(item._id)}
                                        className="absolute -top-2 -right-2 p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-full transition-all cursor-pointer shadow-sm opacity-0 group-hover:opacity-100"
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
                                            <ShoppingCart className="text-gray-300" size={24} />
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <Link to={`/product/${item._id}`} onClick={onClose} className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug hover:text-primary transition-colors">
                                            {item.name}
                                        </Link>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 h-7 overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(item._id, item.quantity, -1)}
                                                    className="w-7 flex items-center justify-center text-gray-600 hover:bg-white hover:text-primary transition-colors cursor-pointer"
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <span className="w-8 flex items-center justify-center text-xs font-bold text-gray-900 bg-white h-full border-x border-gray-200">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(item._id, item.quantity, 1)}
                                                    className="w-7 flex items-center justify-center text-gray-600 hover:bg-white hover:text-primary transition-colors cursor-pointer"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                            <span className="font-mono text-sm font-bold text-primary-dark">
                                                Rs. {(item.price * item.quantity).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="px-5 py-5 border-t border-gray-100 bg-gray-50 shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-gray-600">Subtotal</span>
                            <span className="font-mono text-lg font-extrabold text-gray-900">
                                Rs. {totalAmount.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate("/checkout");
                                }}
                                className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-sm tracking-wide transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
                            >
                                Checkout
                            </button>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate("/cart");
                                }}
                                className="w-full py-3.5 bg-white border border-primary text-primary hover:bg-primary-pale rounded-xl font-bold text-sm tracking-wide transition-colors cursor-pointer"
                            >
                                Open Full Cart
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartDrawer;
