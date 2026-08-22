import { X, Package, Calendar, Clock, ChevronRight, ShoppingBag, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useGetUserOrders } from "../api/hooks/orders.api";

const OrdersDrawer = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const drawerRef = useRef(null);
    const { getUserOrders, loading } = useGetUserOrders();
    const [orders, setOrders] = useState([]);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        if (isOpen && !hasFetched) {
            (async () => {
                const resp = await getUserOrders();
                if (resp?.orders) {
                    setOrders(resp.orders.slice(0, 5)); // show latest 5
                }
                setHasFetched(true);
            })();
        }
    }, [isOpen, hasFetched, getUserOrders]);

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

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case "delivered":
                return "bg-green-100 text-green-700 border-green-200";
            case "pending":
                return "bg-amber-100 text-amber-700 border-amber-200";
            case "processing":
            case "shipped":
                return "bg-primary-pale text-primary-dark border-primary-light";
            case "cancelled":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
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
                        <Package size={20} className="text-primary" />
                        <h2 className="text-lg font-bold text-gray-900 font-sans tracking-tight">Recent Orders</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                        aria-label="Close orders"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
                    {loading && !hasFetched ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <Loader2 size={32} className="animate-spin text-primary" />
                            <p className="text-sm font-bold text-gray-500">Loading orders...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-primary-pale rounded-full flex items-center justify-center text-primary-dark">
                                <ShoppingBag size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">No recent orders</h3>
                                <p className="text-sm text-gray-500 mt-1">Looks like you haven't placed any orders yet.</p>
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
                            {orders.map((order) => (
                                <Link
                                    key={order.id || order._id}
                                    to={`/order-details/${order.id || order._id}`}
                                    onClick={onClose}
                                    className="block bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-primary-light hover:shadow-md transition-all group relative"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                            <Calendar size={14} />
                                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            })}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusStyles(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                                Order Total
                                            </p>
                                            <p className="text-lg font-black text-gray-900 leading-none">
                                                Rs. {order.totalAmount?.toLocaleString() || 0}
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white text-gray-400 transition-colors">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-dashed border-gray-100 flex gap-2 overflow-hidden">
                                        {/* Show small thumbnails of items if possible */}
                                        {order.items?.slice(0, 4).map((item, idx) => (
                                            <div key={idx} className="w-8 h-8 rounded bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                {item.quantity}x
                                            </div>
                                        ))}
                                        {order.items?.length > 4 && (
                                            <div className="w-8 h-8 rounded bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                +{order.items.length - 4}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {orders.length > 0 && (
                    <div className="px-5 py-5 border-t border-gray-100 bg-gray-50 shrink-0">
                        <button
                            onClick={() => {
                                onClose();
                                navigate("/orders");
                            }}
                            className="w-full py-3.5 bg-white border border-gray-200 text-gray-800 hover:bg-gray-100 hover:border-gray-300 rounded-xl font-bold text-sm tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                            View All Orders <ChevronRight size={16} className="text-gray-400" />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default OrdersDrawer;
