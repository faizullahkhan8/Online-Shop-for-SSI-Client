import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useGetOrderById } from "../api/hooks/orders.api";
import {
    CheckCircle2,
    Truck,
    PackageCheck,
    ArrowRight,
    Loader2,
    MapPin,
    CreditCard,
    Receipt,
    ShoppingBag,
    PartyPopper
} from "lucide-react";
import Button from "../UI/Button";
import { getImageUrl, handleImageError } from "../utils/imageHelper";

const OrderSuccessPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { getOrderById, loading } = useGetOrderById();
    const orderId = location.state?.orderId;
    const [order, setOrder] = useState(null);

    useEffect(() => {
        if (!orderId) {
            navigate("/orders");
            return;
        }
        (async () => {
            const resp = await getOrderById(orderId);
            if (resp?.order) setOrder(resp.order);
        })();
    }, [orderId, navigate]);

    if (loading || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-sm font-bold uppercase tracking-widest text-primary/70">
                    Verifying transaction...
                </p>
            </div>
        );
    }

    const itemsSubtotal = order.items?.reduce(
        (sum, item) => sum + (item.totalAmount || item.quantity * item.price),
        0,
    );
    const taxAmount = Number(order.taxAmount) || 0;
    const shippingFee = Number(order.shippingFee) || 0;
    const grandTotal = Number(order.grandTotal) || 0;

    return (
        <div className="bg-[#FAFBF9] min-h-screen py-12 lg:py-20 font-sans selection:bg-primary/10 selection:text-primary relative overflow-hidden">
            {/* Background Blob Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-40 right-10 w-[400px] h-[400px] bg-primary-pale/20 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto">
                    
                    {/* Header Card */}
                    <div className="bg-white rounded-t-3xl shadow-sm border border-gray-100 p-10 text-center relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-primary-light via-primary to-primary-dark" />
                        
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-pale/30 rounded-full mb-6 relative">
                            <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-50" />
                            <PartyPopper size={48} className="text-primary relative z-10 drop-shadow-sm" />
                        </div>
                        
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                            Thank you for your order!
                        </h1>
                        <p className="text-gray-500 font-medium max-w-md mx-auto mb-8">
                            We've received your order and are getting it ready to be shipped. We will notify you when it's on its way.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <span className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl font-bold text-sm border border-gray-200">
                                Order #{order._id.substring(0, 8).toUpperCase()}
                            </span>
                            <span className="px-4 py-2 bg-primary/10 text-primary-dark rounded-xl font-bold text-sm border border-primary/20 flex items-center gap-2">
                                <CheckCircle2 size={16} />
                                Payment Successful
                            </span>
                        </div>
                    </div>

                    {/* Order Details Body */}
                    <div className="bg-white shadow-sm border-x border-b border-gray-100 p-8 md:p-10 rounded-b-3xl">
                        
                        {/* Status Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 pb-10 border-b border-gray-100">
                            <InfoTile icon={<Truck size={20} />} label="Delivery Method" value={order.shippingMethod || "Standard"} />
                            <InfoTile icon={<CreditCard size={20} />} label="Payment" value={order.payment?.method === 'cod' || order.payment?.method === 'COD' ? 'Cash on Delivery' : 'Online Payment'} />
                            <InfoTile icon={<PackageCheck size={20} />} label="Status" value="Processing" highlight />
                            <InfoTile icon={<Receipt size={20} />} label="Total Paid" value={`Rs ${grandTotal.toLocaleString()}`} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Delivery Information */}
                            <div className="flex flex-col h-full">
                                <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <MapPin className="text-primary" size={18} />
                                    Delivery Address
                                </h3>
                                <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-100 flex-1">
                                    <p className="font-bold text-gray-900 text-lg mb-2">{order.recipient?.name || order.user?.name || "Customer"}</p>
                                    <p className="text-gray-600 leading-relaxed mb-4">
                                        {order.recipient?.street}<br />
                                        {order.recipient?.city}{order.recipient?.state ? `, ${order.recipient.state}` : ''}<br />
                                        {order.recipient?.country}{order.recipient?.postalCode ? `, ${order.recipient.postalCode}` : ''}
                                    </p>
                                    <p className="text-sm font-semibold text-gray-700 bg-white inline-block px-3 py-1.5 rounded-lg border border-gray-200">
                                        📞 {order.recipient?.phone || order.user?.phone || "No phone"}
                                    </p>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="flex flex-col h-full">
                                <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <ShoppingBag className="text-primary" size={18} />
                                    Order Summary
                                </h3>
                                <div className="bg-white border border-gray-100 p-6 rounded-2xl flex-1 shadow-sm">
                                    <div className="space-y-4 mb-6">
                                        {order.items?.map((item) => (
                                            <div key={item.product?._id || item.product} className="flex gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center p-2 border border-gray-100 shrink-0">
                                                    <img 
                                                        src={getImageUrl(item.product?.image || item.image)} 
                                                        alt={item.name} 
                                                        className="w-full h-full object-contain mix-blend-multiply"
                                                        onError={(e) => handleImageError(e, "product")}
                                                    />
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.product?.name || item.name || "Product Item"}</p>
                                                    <p className="text-xs font-semibold text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-sm font-bold text-gray-900">
                                                        Rs {(item.totalAmount || item.quantity * item.price).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="pt-4 border-t border-gray-100 space-y-3">
                                        <div className="flex justify-between items-center text-sm font-semibold text-gray-500">
                                            <span>Subtotal</span>
                                            <span className="text-gray-900">Rs {itemsSubtotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-semibold text-gray-500">
                                            <span>Tax</span>
                                            <span className="text-gray-900">Rs {taxAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-semibold text-gray-500">
                                            <span>Shipping</span>
                                            <span className="text-gray-900">Rs {shippingFee.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100">
                                            <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total</span>
                                            <span className="text-2xl font-black text-primary">
                                                Rs {grandTotal.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/orders">
                                <Button className="w-full sm:w-auto !px-8 !py-3.5 !rounded-xl !text-sm !font-bold flex items-center justify-center gap-2">
                                    View Order History
                                    <ArrowRight size={18} />
                                </Button>
                            </Link>
                            <Link to="/">
                                <Button variant="outline" className="w-full sm:w-auto !px-8 !py-3.5 !rounded-xl !text-sm !font-bold bg-white text-gray-700 hover:bg-gray-50 border-gray-200">
                                    Continue Shopping
                                </Button>
                            </Link>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoTile = ({ label, value, icon, highlight = false }) => (
    <div className="flex flex-col items-center justify-center text-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${highlight ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
            {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
            {label}
        </span>
        <span className={`text-sm font-bold ${highlight ? "text-primary" : "text-gray-900"}`}>
            {value}
        </span>
    </div>
);

export default OrderSuccessPage;