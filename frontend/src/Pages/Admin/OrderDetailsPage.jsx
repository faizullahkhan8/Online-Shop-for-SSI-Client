import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    useGetOrderById,
    useUpdateOrderStatus,
    useUpdatePaymentStatus,
    useDeleteOrder,
    useCancelOrderItem,
    useCancelOrder,
} from "../../api/hooks/orders.api.js";
import {
    ArrowLeft,
    Package,
    User,
    MapPin,
    Calendar,
    Trash2,
    ShieldCheck,
    Truck,
    Loader2,
    XCircle,
} from "lucide-react";
import CancellationModal from "../../Components/CancellationModal.jsx";

const OrderDetails = () => {
    const { id } = useParams();
    const orderId = id;
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const { getOrderById, loading } = useGetOrderById();
    const { cancelOrder, loading: cancelOrderLoading } = useCancelOrder();
    const { updateOrderStatus } = useUpdateOrderStatus();
    const { updatePaymentStatus, loading: paymentLoading } =
        useUpdatePaymentStatus();
    const { deleteOrder } = useDeleteOrder();
    const { cancelOrderItem, loading: cancelLoading } = useCancelOrderItem();

    const [orderCancelModal, setOrderCancelModal] = useState(false);

    const [cancelModal, setCancelModal] = useState({
        isOpen: false,
        itemId: null,
    });

    useEffect(() => {
        if (orderId) {
            getOrderById(orderId).then((res) => {
                if (res?.success) setOrder(res.order);
            });
        }
    }, [orderId]);

    const handleStatusUpdate = async (newStatus) => {
        if (!orderId) return;
        const res = await updateOrderStatus({ orderId, status: newStatus });
        if (res?.order) setOrder(res.order);
    };

    const handlePaymentVerify = async () => {
        if (!orderId) return;
        const res = await updatePaymentStatus({ orderId, ispaid: true });
        if (res?.order) setOrder(res.order);
    };

    const handleDelete = async () => {
        const res = await deleteOrder(orderId);
        if (res?.success) navigate(-1);
    };

    // cancel item
    const handleOpenItemCancelModal = (itemId) => {
        setCancelModal({ isOpen: true, itemId });
    };

    // cancel item
    const handleCloseItemCancelModal = () => {
        setCancelModal({ isOpen: false, itemId: null });
    };

    // cancel item
    const handleConfirmItemCancel = async (reason) => {
        if (!cancelModal.itemId || !orderId) return;

        const res = await cancelOrderItem({
            orderId,
            itemId: cancelModal.itemId,
            reason,
        });
        if (res?.success) {
            if (res.order) setOrder(res.order);
            handleCloseItemCancelModal();
        }
    };

    // cancel order itself
    const handleOpenOrderCancelModal = () => {
        setOrderCancelModal(true);
    };

    // cancel order itself
    const handleCloseOrderCancelModal = () => {
        setOrderCancelModal(false);
    };

    // cancel order itself
    const handleConfirmOrderCancel = async (reason) => {
        if (!orderId) return;

        const res = await cancelOrder({
            orderId,
            reason,
        });

        if (res?.success && res.order) {
            setOrder(res.order);
            handleCloseOrderCancelModal();
        }
    };

    if (!order || loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2
                    className="animate-spin text-primary mb-3"
                    size={32}
                />
                <p className="text-sm font-medium text-gray-500">
                    Loading order details...
                </p>
            </div>
        );
    }

    const itemsSubtotal = order.items.reduce((sum, item) => {
        if (item.status === "cancelled") return sum;
        return sum + (item.totalAmount || item.quantity * item.price);
    }, 0);
    const taxAmount = Number(order.taxAmount) || 0;
    const shippingFee = Number(order.shippingFee) || 0;

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "delivered":
                return "bg-green-100 text-green-700 border-green-200";
            case "shipped":
                return "bg-primary-light text-primary-dark border-primary-light";
            case "pending":
                return "bg-amber-100 text-amber-700 border-amber-200";
            case "cancelled":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <div className="space-y-6">
            {/* seperate item cancellation */}
            <CancellationModal
                isOpen={cancelModal.isOpen}
                onClose={handleOpenOrderCancelModal}
                onConfirm={handleConfirmItemCancel}
                loading={cancelLoading}
                title="Cancel Item"
                description="Are you sure you want to cancel this item? Stock will be restored and the order total will be adjusted."
            />
            {/* cancel order itself */}
            <CancellationModal
                isOpen={orderCancelModal}
                onClose={handleCloseOrderCancelModal}
                onConfirm={handleConfirmOrderCancel}
                loading={cancelOrderLoading}
                title="Cancel Order"
                description="Are you sure you want to cancel the entire order? All non-cancelled items will be cancelled and stock will be restored."
            />

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <h2 className="text-2xl font-display text-gray-900">
                                Order #{order._id.slice(-8).toUpperCase()}
                            </h2>
                            <span
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusColor(order.status)}`}
                            >
                                {order.status.charAt(0).toUpperCase() +
                                    order.status.slice(1)}
                            </span>
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md border border-gray-200">
                                {order.payment?.method || "COD"}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Calendar size={14} />
                            {new Date(order.createdAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                        {order.status === "cancelled" &&
                            order.cancellationReason && (
                                <p className="text-sm text-red-600 mt-1">
                                    Cancellation reason:{" "}
                                    {order.cancellationReason}
                                </p>
                            )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!order.payment?.ispaid && (
                        <button
                            onClick={handlePaymentVerify}
                            disabled={paymentLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors border border-green-200 disabled:opacity-50"
                        >
                            {paymentLoading ? "Verifying..." : "Verify Payment"}
                        </button>
                    )}

                    {order.status === "pending" && (
                        <button
                            onClick={handleOpenOrderCancelModal}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
                        >
                            <XCircle size={16} />
                            Cancel Order
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Package size={16} className="text-primary" />
                                Order Items
                            </h3>
                            <span className="text-sm font-medium text-gray-600">
                                {order.items.length}{" "}
                                {order.items.length === 1 ? "item" : "items"}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-xs font-semibold text-gray-700">
                                            Product
                                        </th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold text-gray-700">
                                            Quantity
                                        </th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700">
                                            Price
                                        </th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700">
                                            Total
                                        </th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.items.map((item, index) => (
                                        <tr
                                            key={index}
                                            className={`${item.status === "cancelled" ? "bg-red-50/30" : "hover:bg-gray-50"} transition-colors`}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-start gap-3">
                                                    <img
                                                        src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${item.product?.image}`}
                                                        className={`w-12 h-12 object-cover rounded-lg border border-gray-200 ${
                                                            item.status ===
                                                            "cancelled"
                                                                ? "grayscale opacity-50"
                                                                : ""
                                                        }`}
                                                        alt={item.product?.name}
                                                    />

                                                    <div className="flex-1">
                                                        {/* Product name + status */}
                                                        <div className="flex items-center gap-2">
                                                            <p
                                                                className={`text-sm font-medium ${
                                                                    item.status ===
                                                                    "cancelled"
                                                                        ? "line-through text-gray-400"
                                                                        : "text-gray-900"
                                                                }`}
                                                            >
                                                                {
                                                                    item.product
                                                                        ?.name
                                                                }
                                                            </p>

                                                            {item.status ===
                                                                "cancelled" && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                                                                    <XCircle
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                    Cancelled
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Cancellation meta */}
                                                        {item.status ===
                                                            "cancelled" && (
                                                            <div className="mt-1 space-y-0.5">
                                                                {item.cancellationReason && (
                                                                    <p className="text-xs text-gray-500">
                                                                        <span className="font-medium text-gray-600">
                                                                            Reason:
                                                                        </span>{" "}
                                                                        {
                                                                            item.cancellationReason
                                                                        }
                                                                    </p>
                                                                )}

                                                                {item
                                                                    .cancelledBy
                                                                    ?.name && (
                                                                    <p className="text-xs text-gray-500">
                                                                        <span className="font-medium text-gray-600">
                                                                            Cancelled
                                                                            by:
                                                                        </span>{" "}
                                                                        {
                                                                            item
                                                                                .cancelledBy
                                                                                .name
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center self-start">
                                                <span
                                                    className={`text-sm font-medium text-gray-900 ${item.status === "cancelled" ? "line-through text-gray-400" : ""}`}
                                                >
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right text-sm text-gray-600">
                                                Rs {item.price.toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span
                                                    className={`text-sm font-semibold text-gray-900 ${item.status === "cancelled" ? "line-through text-gray-400" : ""}`}
                                                >
                                                    Rs{" "}
                                                    {(
                                                        item.quantity *
                                                        item.price
                                                    ).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {item.status !== "cancelled" &&
                                                    order.status ===
                                                        "pending" && (
                                                        <button
                                                            onClick={() =>
                                                                handleOpenItemCancelModal(
                                                                    item._id,
                                                                )
                                                            }
                                                            className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Order Summary & Status */}
                        <div className="p-5 bg-gray-50 border-t border-gray-200">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                {/* Status Update */}
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-700 mb-3">
                                        Update Order Status
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            "pending",
                                            "shipped",
                                            "delivered",
                                        ].map((status) => (
                                            <button
                                                disabled={Boolean(
                                                    order.status ===
                                                    "cancelled",
                                                )}
                                                key={status}
                                                onClick={() =>
                                                    handleStatusUpdate(status)
                                                }
                                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                                    order.status === status
                                                        ? "bg-primary text-white"
                                                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                }`}
                                            >
                                                {status
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    status.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Totals */}
                                <div className="space-y-2 md:min-w-50 md:border-l md:border-gray-200 md:pl-6">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium">
                                            Rs {itemsSubtotal.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Tax</span>
                                        <span className="font-medium">
                                            Rs {taxAmount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Shipping</span>
                                        <span className="font-medium">
                                            Rs {shippingFee.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-200">
                                        <span className="text-sm font-semibold text-gray-900">
                                            Grand Total
                                        </span>
                                        <span className="text-lg font-bold text-primary">
                                            Rs{" "}
                                            {order.grandTotal?.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <aside className="space-y-6">
                    {/* Customer Info */}
                    <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User size={16} className="text-primary" />
                            Customer
                        </h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary font-semibold text-sm">
                                {order.recipient?.name?.[0]?.toUpperCase() ||
                                    "G"}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {order.recipient?.name || "Guest"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {order.recipient?.phone}
                                </p>
                                {order.userId?.email && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {order.userId.email}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                <ShieldCheck
                                    size={12}
                                    className="text-primary"
                                />
                                Payment Status
                            </p>
                            <p
                                className={`text-sm font-semibold ${order.payment?.ispaid ? "text-green-600" : "text-amber-600"}`}
                            >
                                {order.payment?.ispaid ? "Verified" : "Pending"}
                            </p>
                        </div>
                    </section>

                    {/* Shipping Info */}
                    <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Truck size={16} className="text-primary" />
                            Shipping
                        </h3>
                        <div className="flex gap-3 mb-4">
                            <div className="mt-0.5">
                                <MapPin size={16} className="text-gray-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-900 mb-1">
                                    Delivery Address
                                </p>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {order.recipient.street}
                                    {order.recipient.addressLine2 &&
                                        `, ${order.recipient.addressLine2}`}
                                    <br />
                                    {order.recipient.city}
                                    {order.recipient.state &&
                                        `, ${order.recipient.state}`}
                                    {order.recipient.postalCode &&
                                        ` ${order.recipient.postalCode}`}
                                    {order.recipient.country &&
                                        `, ${order.recipient.country}`}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                <span className="text-xs font-medium text-gray-600">
                                    Shipping Method
                                </span>
                                <span className="text-xs font-semibold text-gray-900">
                                    {order.shippingMethod
                                        ? order.shippingMethod
                                              .charAt(0)
                                              .toUpperCase() +
                                          order.shippingMethod.slice(1)
                                        : "Standard"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                <span className="text-xs font-medium text-gray-600">
                                    Payment Method
                                </span>
                                <span className="text-xs font-semibold text-gray-900">
                                    {order.payment?.method || "COD"}
                                </span>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
};

export default OrderDetails;
