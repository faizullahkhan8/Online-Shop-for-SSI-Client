import { Suspense } from "react";
import RouteLoading from "../Components/UI/PageLoading";
import { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "../Components/Admin/AdminSidebar";
import { useSocket, SOCKET_EVENTS } from "../context/SocketContext";
import { playNotificationSound } from "../utils/notificationAudio";
import { toast } from "react-toastify";
import { Menu, ShoppingBag, FileText, ArrowRight } from "lucide-react";

import { createPortal } from "react-dom";
import { useDialog } from "../hooks/useDialog";

const AdminNavigation = ({ onClose }) => {
    const panelRef = useRef(null);
    useDialog(true, onClose, panelRef);
    return createPortal(<div className="fixed inset-0 z-[1001] lg:hidden">
        <div data-dialog-backdrop="" aria-hidden="true" className="absolute inset-0 bg-gray-950/50" onClick={onClose} />
        <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Admin navigation" tabIndex={-1} className="relative h-dvh w-72 max-w-[85vw] bg-white overflow-y-auto shadow-xl">
            <AdminSidebar mobile onNavigate={onClose} />
        </div>
    </div>, document.body);
};

const AdminLayout = () => {
    const [mobileMenu, setMobileMenu] = useState(false);
    useEffect(() => {
        const desktop = window.matchMedia("(min-width: 1024px)");
        const closeOnDesktop = event => { if (event.matches) setMobileMenu(false); };
        desktop.addEventListener("change", closeOnDesktop);
        return () => desktop.removeEventListener("change", closeOnDesktop);
    }, []);
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
                        <span className="p-1 rounded-md bg-primary-pale text-primary">
                            <ShoppingBag size={15} />
                        </span>
                        <span>{orderId} Received!</span>
                    </div>
                    <p className="text-xs text-gray-600">
                        From <span className="font-semibold text-gray-800">{customerName}</span> {total && `• ${total}`}
                    </p>
                    <button
                        onClick={() => navigate("/admin-dashboard/orders")}
                        className="mt-1 text-[11px] font-bold text-primary hover:text-primary-dark flex items-center gap-1 hover:underline w-fit cursor-pointer"
                    >
                        View Orders <ArrowRight size={12} />
                    </button>
                </div>,
                {
                    autoClose: 6000,
                    icon: false,
                    className: "!rounded-xl !shadow-lg border border-primary-light",
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
        <div className="admin-workspace flex h-dvh bg-surface overflow-hidden">
            <div className="hidden lg:block shrink-0"><AdminSidebar /></div>
            {mobileMenu && <AdminNavigation onClose={() => setMobileMenu(false)} />}

            <div className="flex-1 flex flex-col min-w-0">
                <header className="lg:hidden flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2">
                    <button type="button" aria-label="Open admin navigation" aria-expanded={mobileMenu} onClick={() => setMobileMenu(true)} className="h-11 w-11 grid place-items-center rounded-xl hover:bg-primary-pale text-primary-dark"><Menu size={22} /></button>
                    <span className="font-semibold text-gray-900">Zada Admin</span>
                    <a href="/" className="text-sm font-medium text-primary-dark px-3 py-2">Visit store</a>
                </header>
                <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Suspense fallback={<RouteLoading />}><Outlet /></Suspense>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;