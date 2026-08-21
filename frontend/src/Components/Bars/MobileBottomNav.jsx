import { Link, useLocation } from "react-router-dom";
import { Home, List, ShoppingCart, FileText, User } from "lucide-react";
import { useSelector } from "react-redux";

const MobileBottomNav = () => {
    const location = useLocation();
    const cartItems = useSelector((state) => state.cart.items || []);
    const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

    const navItems = [
        { path: "/", icon: Home, label: "Home" },
        { path: "/products", icon: List, label: "Categories" },
        { path: "/cart", icon: ShoppingCart, label: "Cart", badge: cartCount },
        { path: "/upload-prescription", icon: FileText, label: "Upload Rx" },
        { path: "/profile", icon: User, label: "Profile" },
    ];

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
            <div className="bg-white/85 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl flex items-center justify-between px-2 py-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    // Strict match for Home, loose match for products/categories
                    const isActive = item.path === "/" 
                        ? location.pathname === "/"
                        : location.pathname.startsWith(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="relative flex flex-col items-center justify-center w-16 h-12 transition-all duration-300 group"
                        >
                            <div
                                className={`flex items-center justify-center w-[34px] h-[34px] rounded-full transition-all duration-300 ${
                                    isActive
                                        ? "bg-[#1E5128] text-white shadow-md -translate-y-1"
                                        : "text-gray-500 group-hover:bg-gray-100"
                                }`}
                            >
                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                {item.badge > 0 && (
                                    <span className="absolute top-0 right-1 w-4 h-4 bg-[#74AA34] text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span
                                className={`text-[9px] font-bold mt-1 transition-all duration-300 ${
                                    isActive ? "text-[#1E5128] opacity-100" : "text-gray-400 opacity-90"
                                }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileBottomNav;
