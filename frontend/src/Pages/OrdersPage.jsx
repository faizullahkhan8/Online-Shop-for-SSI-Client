import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGetUserOrders } from "../api/hooks/orders.api";
import {
    Package,
    Calendar,
    Tag,
    ChevronRight,
    ShoppingBag,
    Loader2,
} from "lucide-react";
import CancellationModal from "../Components/CancellationModal.jsx";
import { useCancelOrder } from "../api/hooks/orders.api.js";
import { getImageUrl } from "../utils/imageHelper";

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const { getUserOrders, loading } = useGetUserOrders();

    useEffect(() => {
        (async () => {
            const resp = await getUserOrders();
            if (resp?.orders) setOrders(resp.orders);
        })();
    }, []);

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case "delivered":
                return "bg-green-50 text-green-700 border-green-200";
            case "pending":
                return "bg-amber-50 text-amber-700 border-amber-200";
            case "processing":
            case "shipped":
                return "bg-primary-pale text-primary-dark border-primary-light";
            case "cancelled":
                return "bg-red-50 text-red-700 border-red-200";
            default:
                return "bg-gray-50 text-gray-600 border-gray-200";
        }
    };

    const [cancelModal, setCancelModal] = useState({
        isOpen: false,
        orderId: null,
    });

    const { cancelOrder, loading: cancelLoading } = useCancelOrder();

    const handleOpenCancelModal = (orderId) => {
        setCancelModal({ isOpen: true, orderId });
    };

    const handleCloseCancelModal = () => {
        setCancelModal({ isOpen: false, orderId: null });
    };

    const handleConfirmCancel = async (reason) => {
        if (!cancelModal.orderId) return;

        const res = await cancelOrder({ orderId: cancelModal.orderId, reason });
        if (res?.success) {
            // Update local state
            setOrders(orders.map(order =>
                order.id === cancelModal.orderId
                    ? { ...order, status: 'cancelled' }
                    : order
            ));
            handleCloseCancelModal();
        }
    };

    return (
        <div className="bg-gray-50 min-h-[85vh] py-8 lg:py-12">
            <div className="container mx-auto px-4 lg:px-8 max-w-[1200px]">
                <CancellationModal
                    isOpen={cancelModal.isOpen}
                    onClose={handleCloseCancelModal}
                    onConfirm={handleConfirmCancel}
                    loading={cancelLoading}
                    title="Cancel Order"
                    description="Are you sure you want to cancel this order? This action cannot be undone and we will stop processing your shipment."
                />

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="text-primary" size={20} />
                            <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">
                                Order History
                            </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                            My Orders
                        </h1>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white border border-gray-100 rounded-3xl shadow-sm">
                        <Loader2 className="animate-spin text-primary mb-4" size={40} />
                        <p className="text-gray-500 text-sm font-bold">
                            Loading your orders...
                        </p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white border border-gray-100 shadow-sm rounded-3xl py-24 px-6 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-primary-pale rounded-full flex items-center justify-center mb-6">
                            <ShoppingBag size={40} className="text-primary-dark" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">
                            No orders found
                        </h3>
                        <p className="text-gray-500 text-sm mb-8 max-w-sm">
                            You haven't placed any orders yet. Once you do, they'll appear here.
                        </p>
                        <Link
                            to="/products"
                            className="flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-md hover:shadow-lg"
                        >
                            Start Shopping
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div
                                key={order._id}
                                className="bg-white border-2 border-transparent hover:border-primary-light rounded-3xl p-5 lg:p-8 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-gray-100 pb-5 mb-5">
                                    <div className="flex flex-wrap gap-8">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                <Tag size={14} /> Order ID
                                            </div>
                                            <div className="text-sm font-black text-gray-900">
                                                #{order._id}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                <Calendar size={14} /> Date Placed
                                            </div>
                                            <div className="text-sm font-bold text-gray-700">
                                                {new Date(order.date).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-3">
                                        <div className="flex items-center gap-3">
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={() => handleOpenCancelModal(order._id)}
                                                    className="px-3 py-1 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    Cancel Order
                                                </button>
                                            )}
                                            <span
                                                className={`px-3 py-1 rounded-lg text-[10px] uppercase tracking-widest font-black border ${getStatusStyles(order.status)}`}
                                            >
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="text-xl font-black text-gray-900">
                                            Rs {order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {order.items.map((item, idx) => (
                                        <Link
                                            to={`/product/${item.product?._id}`}
                                            key={idx}
                                            className="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 hover:border-primary-light hover:bg-white transition-all"
                                        >
                                            <div className="w-16 h-16 bg-white border border-gray-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                                                <img
                                                    src={getImageUrl(item.product?.image)}
                                                    className="w-full h-full object-contain p-2 mix-blend-multiply"
                                                    alt="product"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://placehold.co/100x100/EDF6E5/4d8d3a?text=Rx";
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-gray-900 text-sm truncate group-hover:text-primary transition-colors">
                                                    {item.title || item.product?.name}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-md">
                                                        Qty: {item.quantity}
                                                    </span>
                                                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                                    <span className={`text-[10px] font-black uppercase tracking-wider ${item.status === 'cancelled' ? 'text-red-500' : 'text-primary'}`}>
                                                        {item.status === 'cancelled' ? 'Cancelled' : 'Fulfilled'}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <div className="mt-5 pt-5 border-t border-gray-100 flex justify-end">
                                    <Link to={`/order-details/${order._id}`} className="text-sm font-bold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors">
                                        View Full Order Details <ChevronRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersPage;