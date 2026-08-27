import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "../Components/Admin/AdminSidebar";
import { useSocket, SOCKET_EVENTS } from "../context/SocketContext";
import { playNotificationSound } from "../utils/notificationAudio";
import { toast } from "react-toastify";
import { ShoppingBag, FileText, ArrowRight } from "lucide-react";

const AdminLayout = () => {
    const { socket, joinAdmin } = useSocket();
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket) return;

        // Guarantee that admin is always joined into admin_room when viewing admin layout
        joinAdmin();

        // Handler for New Order
        const handleNewOrder = (data) => {
            playNotificationSound();
            const orderId = data?.order?._id ? `#${data.order._id.toString().slice(-6).toUpperCase()}` : "New Order";
            const customerName = data?.order?.recipient?.name || "Customer";
            const total = data?.order?.grandTotal ? `Rs. ${data.order.grandTotal.toLocaleString()}` : "";

            toast.info(
                <div className="flex flex-col gap-1.5 py-0.5">
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                        <span className="p-1 rounded-md bg-blue-100 text-blue-600">
                            <ShoppingBag size={15} />
                        </span>
                        <span>{orderId} Received!</span>
                    </div>
                    <p className="text-xs text-gray-600">
                        From <span className="font-semibold text-gray-800">{customerName}</span> {total && `• ${total}`}
                    </p>
                    <button
                        onClick={() => navigate("/admin-dashboard/orders")}
                        className="mt-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline w-fit cursor-pointer"
                    >
                        View Orders <ArrowRight size={12} />
                    </button>
                </div>,
                {
                    autoClose: 6000,
                    icon: false,
                    className: "!rounded-xl !shadow-lg border border-blue-100",
                }
            );
        };

        // Handler for New Prescription
        const handleNewPrescription = (data) => {
            playNotificationSound();
            const name = data?.prescription?.name || "Customer";
            const phone = data?.prescription?.phone || "";

            toast.success(
                <div className="flex flex-col gap-1.5 py-0.5">
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                        <span className="p-1 rounded-md bg-emerald-100 text-emerald-600">
                            <FileText size={15} />
                        </span>
                        <span>New Prescription Uploaded!</span>
                    </div>
                    <p className="text-xs text-gray-600">
                        Uploaded by <span className="font-semibold text-gray-800">{name}</span> {phone && `(${phone})`}
                    </p>
                    <button
                        onClick={() => navigate("/admin-dashboard/prescriptions")}
                        className="mt-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline w-fit cursor-pointer"
                    >
                        Review Prescription <ArrowRight size={12} />
                    </button>
                </div>,
                {
                    autoClose: 6000,
                    icon: false,
                    className: "!rounded-xl !shadow-lg border border-emerald-100",
                }
            );
        };

        socket.on(SOCKET_EVENTS.ORDER_NEW, handleNewOrder);
        socket.on(SOCKET_EVENTS.PRESCRIPTION_NEW, handleNewPrescription);

        return () => {
            socket.off(SOCKET_EVENTS.ORDER_NEW, handleNewOrder);
            socket.off(SOCKET_EVENTS.PRESCRIPTION_NEW, handleNewPrescription);
        };
    }, [socket, navigate, joinAdmin]);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <AdminSidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 lg:p-12 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;