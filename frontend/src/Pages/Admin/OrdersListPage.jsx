import { useState, useEffect } from "react";
import { useGetAllOrder, useMarkOrderViewed } from "../../api/hooks/orders.api.js";
import { Eye, Package, Loader2, CreditCard, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useSocket, SOCKET_EVENTS } from "../../context/SocketContext";

const OrdersList = () => {
    const [orders, setOrders] = useState([]);
    const { getAllOrder, loading } = useGetAllOrder();
    const { markOrderViewed } = useMarkOrderViewed();
    const { socket } = useSocket();

    useEffect(() => {
        (async () => {
            const response = await getAllOrder();
            if (response?.orders) {
                setOrders(response.orders);
            }
        })();
    }, []);

    const handleMarkViewed = async (orderId) => {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, isViewed: true } : o));
        await markOrderViewed(orderId);
    };

    // Live socket listener for instant order arrivals
    useEffect(() => {
        if (!socket) return;

        const handleNewOrder = (data) => {
            if (data?.order) {
                setOrders(prev => [{ ...data.order, isViewed: false }, ...prev.filter(o => o._id !== data.order._id)]);
            }
        };

        socket.on(SOCKET_EVENTS.ORDER_NEW, handleNewOrder);
        return () => socket.off(SOCKET_EVENTS.ORDER_NEW, handleNewOrder);
    }, [socket]);

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case "delivered":
                return "bg-green-50 text-green-700 border-green-200";
            case "shipped":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "cancelled":
                return "bg-red-50 text-red-700 border-red-200";
            case "pending":
                return "bg-amber-50 text-amber-700 border-amber-200";
            case "processing":
                return "bg-purple-50 text-purple-700 border-purple-200";
            default:
                return "bg-gray-50 text-gray-600 border-gray-200";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage all customer orders ({orders.length} total)
                    </p>
                </div>
            </header>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">
                                Order ID
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 border-b border-gray-200 min-w-[180px]">
                                Customer
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">
                                Total
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 border-b border-gray-200 min-w-[200px]">
                                Shipping Address
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">
                                Shipping
                            </th>
                            <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">
                                Payment
                            </th>
                            <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">
                                Method
                            </th>
                            <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">
                                Status
                            </th>
                            <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <TableLoadingState />
                        ) : orders?.length > 0 ? (
                            orders.map((order) => (
                                <tr
                                    key={order._id}
                                    className="hover:bg-gray-50 transition-colors group"
                                >
                                    <td className="px-4 py-3.5 relative">
                                        <div className="flex items-center gap-2.5">
                                            {!order.isViewed && (
                                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-red-100 shrink-0 animate-pulse" title="New / Unread Order" />
                                            )}
                                            <span className="text-sm font-mono font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                                                #{order._id.slice(-8).toUpperCase()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <p className="text-sm font-medium text-gray-900">
                                            {order.recipient?.name ||
                                                "Anonymous"}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {order.recipient?.phone}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="text-sm font-semibold text-gray-900">
                                            Rs{" "}
                                            {order.grandTotal?.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <p className="text-sm text-gray-700 truncate max-w-[200px]">
                                            {order.recipient?.street}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {order.recipient?.city}
                                            {order.recipient?.postalCode
                                                ? `, ${order.recipient?.postalCode}`
                                                : ""}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                                            <Truck
                                                size={14}
                                                className="text-blue-600"
                                            />
                                            {order.shippingMethod
                                                ? order.shippingMethod
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                  order.shippingMethod.slice(1)
                                                : "Standard"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <div
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${
                                                order.payment?.ispaid
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : "bg-red-50 text-red-700 border-red-200"
                                            }`}
                                        >
                                            <div
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    order.payment?.ispaid
                                                        ? "bg-green-500"
                                                        : "bg-red-500"
                                                }`}
                                            />
                                            {order.payment?.ispaid
                                                ? "Paid"
                                                : "Unpaid"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                                            <CreditCard
                                                size={14}
                                                className="text-blue-600"
                                            />
                                            {order.payment?.method || "COD"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span
                                            className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusStyles(order.status)}`}
                                        >
                                            {order.status
                                                .charAt(0)
                                                .toUpperCase() +
                                                order.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right relative">
                                        <Link
                                            to={`/admin-dashboard/orders/${order._id}`}
                                            onClick={() => handleMarkViewed(order._id)}
                                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 inline-flex items-center justify-center transition-colors relative"
                                            title="View Order Details"
                                        >
                                            {!order.isViewed && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-white"></span>
                                            )}
                                            <Eye
                                                size={18}
                                            />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <TableEmptyState />
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TableLoadingState = () => (
    <tr>
        <td colSpan="9" className="px-8 py-16 text-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="text-sm font-medium text-gray-500">
                    Loading orders...
                </span>
            </div>
        </td>
    </tr>
);

const TableEmptyState = () => (
    <tr>
        <td colSpan="9" className="px-8 py-20 text-center">
            <div className="flex flex-col items-center gap-3">
                <Package size={40} className="text-gray-300" />
                <div>
                    <p className="text-sm font-semibold text-gray-900">
                        No orders found
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Orders will appear here once customers place them
                    </p>
                </div>
            </div>
        </td>
    </tr>
);

export default OrdersList;
