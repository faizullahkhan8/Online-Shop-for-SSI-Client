import {
    ArrowLeft,
    Trash2,
    ShoppingBag,
    CreditCard,
    Minus,
    Plus,
    CheckSquare,
    Square,
    ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleItemSelection,
    toggleAllSelection,
} from "../store/slices/cartSlice.js";
import { getImageUrl } from "../utils/imageHelper";

const CartPage = () => {
    const dispatch = useDispatch();
    const { items, selectedTotalAmount } = useSelector((state) => state.cart);

    const handleRemove = (_id) => dispatch(removeFromCart({ _id }));
    const handleQuantityChange = (_id, qty) => qty >= 1 && dispatch(updateQuantity({ _id, quantity: qty }));
    const handleClearCart = () => dispatch(clearCart());
    const handleToggleSelection = (_id) => dispatch(toggleItemSelection({ _id }));
    const handleToggleAllSelection = () => {
        const allSelected = items.every((item) => item.selected);
        dispatch(toggleAllSelection({ selected: !allSelected }));
    };

    const selectedCount = items.filter((item) => item.selected).length;
    const allSelected = items.length > 0 && items.every((item) => item.selected);

    return (
        <div className="bg-gray-50 min-h-[85vh] py-8 lg:py-12">
            <div className="container mx-auto px-4 lg:px-8 max-w-[1200px]">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <ShoppingBag className="text-primary" size={20} />
                            <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">
                                Your Basket
                            </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                            Shopping Cart
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {items.length > 0 && (
                            <>
                                <button
                                    onClick={handleToggleAllSelection}
                                    className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-primary transition-colors cursor-pointer bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-200"
                                >
                                    {allSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                                    {allSelected ? "Deselect All" : "Select All"}
                                </button>
                                <button
                                    onClick={handleClearCart}
                                    className="text-xs font-bold text-red-500 hover:text-white hover:bg-red-500 transition-colors cursor-pointer bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-200 hover:border-red-500"
                                >
                                    Clear Cart
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Cart Items List */}
                    <div className="lg:col-span-8 space-y-4">
                        {items.length === 0 ? (
                            <div className="bg-white border border-gray-100 shadow-sm rounded-3xl py-24 px-6 flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 bg-primary-pale rounded-full flex items-center justify-center mb-6">
                                    <ShoppingBag size={40} className="text-primary-dark" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">
                                    Your cart is empty
                                </h3>
                                <p className="text-gray-500 text-sm mb-8 max-w-sm">
                                    Looks like you haven't added any medicines or health products to your cart yet.
                                </p>
                                <Link
                                    to="/products"
                                    className="flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-md hover:shadow-lg"
                                >
                                    <ArrowLeft size={16} /> Continue Shopping
                                </Link>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div
                                    key={item._id}
                                    className={`bg-white rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:gap-6 items-start sm:items-center transition-all duration-200 relative group overflow-hidden ${
                                        item.selected 
                                            ? "border-2 border-primary-light shadow-md" 
                                            : "border-2 border-transparent shadow-sm hover:shadow-md hover:border-gray-100"
                                    }`}
                                >
                                    {/* Selection Toggle (Mobile floating, Desktop inline) */}
                                    <button
                                        onClick={() => handleToggleSelection(item._id)}
                                        className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 w-8 h-8 flex items-center justify-center transition-colors cursor-pointer shrink-0 z-10 bg-white rounded-lg"
                                    >
                                        {item.selected ? (
                                            <CheckSquare size={24} className="text-primary" />
                                        ) : (
                                            <Square size={24} className="text-gray-300 hover:text-primary-light" />
                                        )}
                                    </button>

                                    {/* Image Wrapper */}
                                    <div className={`w-24 h-24 sm:w-28 sm:h-28 bg-gray-50 rounded-2xl p-2 shrink-0 border border-gray-100 flex items-center justify-center transition-opacity ${!item.selected && "opacity-50 grayscale-[30%]"}`}>
                                        {item.image ? (
                                            <img
                                                src={getImageUrl(item.image)}
                                                alt={item.name}
                                                className="w-full h-full object-contain mix-blend-multiply"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://placehold.co/100x100/EDF6E5/4d8d3a?text=Rx";
                                                }}
                                            />
                                        ) : (
                                            <ShoppingBag className="text-gray-300" size={32} />
                                        )}
                                    </div>

                                    {/* Item Details */}
                                    <div className={`flex-1 w-full transition-opacity ${!item.selected && "opacity-60"}`}>
                                        <div className="pr-12 sm:pr-0">
                                            <Link to={`/product/${item._id}`} className="font-black text-gray-900 text-lg sm:text-xl mb-1 line-clamp-2 hover:text-primary transition-colors leading-tight">
                                                {item.name}
                                            </Link>
                                        </div>
                                        
                                        {item.stock < item.quantity && (
                                            <div className="mb-2">
                                                <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-widest">
                                                    Partially Backordered
                                                </span>
                                                <p className="text-xs font-bold text-amber-500 mt-1">
                                                    Note: Out of stock items will be delivered later.
                                                </p>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center gap-3 mt-1 mb-4">
                                            <span className="text-xl font-black text-primary-dark">
                                                Rs. {item.price.toLocaleString()}
                                            </span>
                                            {item.originalPrice && item.originalPrice > item.price && (
                                                <span className="text-sm text-gray-400 line-through font-bold mt-1">
                                                    Rs. {item.originalPrice.toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 h-10 overflow-hidden shadow-inner">
                                                <button
                                                    disabled={!item.selected}
                                                    onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                                                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-white hover:text-primary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="w-12 h-full flex items-center justify-center text-sm font-black text-gray-900 bg-white border-x border-gray-200 shadow-sm z-10">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    disabled={!item.selected}
                                                    onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                                                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-white hover:text-primary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>

                                            <button
                                                disabled={!item.selected}
                                                onClick={() => handleRemove(item._id)}
                                                className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 size={16} /> <span className="hidden sm:inline">Remove</span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Desktop Subtotal */}
                                    <div className={`hidden sm:flex flex-col items-end shrink-0 pl-4 border-l border-gray-100 transition-opacity ${!item.selected && "opacity-60"}`}>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                            Subtotal
                                        </p>
                                        <p className="font-black text-2xl text-gray-900">
                                            Rs. {(item.price * item.quantity).toLocaleString()}
                                        </p>
                                    </div>
                                    
                                    {/* Mobile Subtotal (Bottom Right) */}
                                    <div className={`sm:hidden absolute bottom-5 right-5 text-right transition-opacity ${!item.selected && "opacity-60"}`}>
                                        <p className="font-black text-lg text-gray-900">
                                            Rs. {(item.price * item.quantity).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}

                        {items.length > 0 && (
                            <div className="pt-4 flex justify-center sm:justify-start">
                                <Link
                                    to="/products"
                                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary hover:bg-primary-pale px-4 py-2 rounded-xl transition-colors"
                                >
                                    <ArrowLeft size={16} /> Continue Shopping
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sticky Panel */}
                    <div className="lg:col-span-4">
                        <div className="bg-white border-2 border-primary-pale shadow-2xl shadow-primary-pale/40 rounded-3xl p-6 md:p-8 sticky top-28">
                            <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-gray-900 tracking-tight">
                                <div className="w-10 h-10 rounded-xl bg-primary-pale flex items-center justify-center">
                                    <CreditCard size={20} className="text-primary-dark" />
                                </div>
                                Order Summary
                            </h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-sm text-gray-600 font-bold">
                                    <span>Total Items</span>
                                    <span className="font-black text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                                        {items.length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600 font-bold">
                                    <span>Selected Items</span>
                                    <span className="font-black text-primary-dark bg-primary-pale px-2.5 py-1 rounded-lg">
                                        {selectedCount}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600 font-bold pt-2">
                                    <span>Subtotal</span>
                                    <span className="font-black text-gray-900 text-base">
                                        Rs. {selectedTotalAmount?.toLocaleString() || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600 font-bold">
                                    <span>Shipping</span>
                                    <span className="text-primary-dark font-black text-xs uppercase tracking-wider bg-primary-pale px-2 py-1 rounded-md">
                                        At Checkout
                                    </span>
                                </div>
                            </div>

                            <div className="border-t-2 border-dashed border-gray-100 pt-6 mb-8 flex justify-between items-end">
                                <div>
                                    <span className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                                        Estimated Total
                                    </span>
                                    <span className="text-4xl font-black text-gray-900 tracking-tighter">
                                        Rs. {selectedTotalAmount?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>

                            <Link
                                to="/checkout"
                                className={`group flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-base font-black transition-all duration-300 shadow-md ${
                                    selectedCount === 0
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                                        : "bg-primary text-white hover:bg-primary-dark hover:shadow-xl hover:-translate-y-1"
                                }`}
                                onClick={(e) => selectedCount === 0 && e.preventDefault()}
                            >
                                Proceed to Checkout
                                {selectedCount > 0 && (
                                    <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs ml-1 group-hover:bg-white/30 transition-colors">
                                        {selectedCount}
                                    </span>
                                )}
                            </Link>

                            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 py-2 rounded-xl">
                                <ShieldCheck size={16} className="text-primary" />
                                100% Secure Checkout Guaranteed
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
