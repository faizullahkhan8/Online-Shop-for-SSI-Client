import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "../Components/Bars/Header";
import Footer from "../Components/Home/Footer";
import MobileBottomNav from "../Components/Bars/MobileBottomNav";
import GlobalWhatsappFab from "../Components/HomeSections/GlobalWhatsappFab";
import { useSocket, SOCKET_EVENTS } from "../context/SocketContext";
import { toast } from "react-toastify";
import { Package, FileText } from "lucide-react";

const BaseLayout = () => {
    const { socket } = useSocket();
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket) return;

        const handleOrderStatus = (data) => {
            const status = data?.order?.status || "updated";
            const orderId = data?.order?._id ? `#${data.order._id.toString().slice(-6).toUpperCase()}` : "Order";
            
            toast.info(
                <div className="flex flex-col gap-1 cursor-pointer" onClick={() => navigate("/orders")}>
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                        <Package size={15} className="text-primary" />
                        <span>{orderId} Status: {status.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                        Your order status has been updated. Tap to view your orders.
                    </p>
                </div>,
                { autoClose: 5000 }
            );
        };

        const handlePrescriptionStatus = (data) => {
            const status = data?.prescription?.status || "updated";
            
            toast.info(
                <div className="flex flex-col gap-1 cursor-pointer">
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                        <FileText size={15} className="text-emerald-600" />
                        <span>Prescription Status: {status.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                        Our pharmacist has updated your prescription request.
                    </p>
                </div>,
                { autoClose: 5000 }
            );
        };

        socket.on(SOCKET_EVENTS.ORDER_STATUS_UPDATED, handleOrderStatus);
        socket.on(SOCKET_EVENTS.PRESCRIPTION_STATUS_UPDATED, handlePrescriptionStatus);

        return () => {
            socket.off(SOCKET_EVENTS.ORDER_STATUS_UPDATED, handleOrderStatus);
            socket.off(SOCKET_EVENTS.PRESCRIPTION_STATUS_UPDATED, handlePrescriptionStatus);
        };
    }, [socket, navigate]);

    return (
        <div className="min-h-screen flex flex-col font-sans selection:bg-primary/10 selection:text-primary">
            <Header />

            <main className="flex-1 bg-[#fafbfc] text-slate-900 pb-20 md:pb-0">
                <Outlet />
            </main>

            <Footer />
            
            <MobileBottomNav />
            <GlobalWhatsappFab />
        </div>
    );
};

export default BaseLayout;
