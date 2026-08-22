import {
    X,
    Home,
    List,
    Package,
    Globe,
    Headphones,
    Building,
    User,
    Heart,
    ShoppingCart,
    LayoutDashboard,
    ChevronRight,
    LogOut,
    FileText
} from "lucide-react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const MobileSideBar = ({
    isMenuOpen,
    setIsMenuOpen,
    isAuthenticated,
    cartCount,
    onCartClick,
    onWishlistClick,
    onOrdersClick,
    onRegisterClick,
    onLoginClick,
}) => {
    const { user } = useSelector((state) => state.auth);

    return (
        <>
            {/* Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] md:hidden transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Sidebar Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-[85%] max-w-[340px] bg-gray-50 z-[70] md:hidden transform transition-transform duration-400 ease-in-out shadow-2xl flex flex-col ${
                    isMenuOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Modern Gradient Header */}
                <div className="bg-gradient-to-br from-gray-950 to-primary-dark pt-10 pb-6 px-6 relative overflow-hidden rounded-bl-3xl">
                    <div className="absolute top-0 right-0 p-4">
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-md"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {isAuthenticated ? (
                        <div className="flex items-center gap-4 mt-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                                <User size={28} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-primary-light text-xs font-semibold uppercase tracking-wider mb-1">
                                    Welcome back
                                </p>
                                <p className="font-bold text-white text-lg truncate">
                                    {user?.name}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4">
                            <h3 className="font-extrabold text-2xl text-white mb-2 leading-tight">
                                Your <span className="text-primary-light">Wellness</span><br/>Journey Starts Here
                            </h3>
                            <p className="text-white/80 text-sm mb-5 leading-relaxed max-w-[240px]">
                                Login to track orders, manage prescriptions, and access exclusive deals.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        setIsMenuOpen(false);
                                        if (onLoginClick) onLoginClick(e);
                                    }}
                                    className="inline-flex flex-1 items-center justify-center bg-white/10 text-white hover:bg-white/20 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={(e) => {
                                        setIsMenuOpen(false);
                                        if (onRegisterClick) onRegisterClick(e);
                                    }}
                                    className="inline-flex flex-1 items-center justify-center bg-white text-primary-dark hover:bg-primary-pale py-3 rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Decorative Background Elements */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                    <div className="absolute top-10 -left-10 w-24 h-24 bg-primary/20 rounded-full blur-xl"></div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6">
                    {/* Quick Action Buttons (If Authenticated) */}
                    {isAuthenticated && (
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                to="/profile"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex flex-col items-center justify-center gap-2 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 hover:border-primary-light transition-all"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary-pale text-primary flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <span className="text-xs font-semibold text-gray-700">Profile</span>
                            </Link>
                            <Link
                                to="/upload-prescription"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex flex-col items-center justify-center gap-2 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 hover:border-primary-light transition-all"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary-pale text-primary-dark flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <span className="text-xs font-semibold text-gray-700">Upload Rx</span>
                            </Link>
                        </div>
                    )}

                    {/* Navigation Menu */}
                    <div>
                        <p className="px-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-400 mb-3">
                            Explore
                        </p>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {user?.role === "admin" && (
                                <NavItem
                                    setIsMenuOpen={setIsMenuOpen}
                                    to="/admin-dashboard"
                                    icon={<LayoutDashboard size={18} />}
                                    label="Admin Panel"
                                    color="text-indigo-600 bg-indigo-50"
                                />
                            )}
                            <NavItem
                                setIsMenuOpen={setIsMenuOpen}
                                to="/"
                                icon={<Home size={18} />}
                                label="Home"
                            />
                            <NavItem
                                setIsMenuOpen={setIsMenuOpen}
                                to="/products"
                                icon={<List size={18} />}
                                label="All Categories"
                            />
                        </div>
                    </div>

                    <div>
                        <p className="px-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-400 mb-3">
                            My Account
                        </p>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <NavItem
                                setIsMenuOpen={setIsMenuOpen}
                                onClick={onOrdersClick}
                                icon={<Package size={18} />}
                                label="My Orders"
                            />
                            <NavItem
                                setIsMenuOpen={setIsMenuOpen}
                                onClick={onWishlistClick}
                                icon={<Heart size={18} />}
                                label="Favorites"
                            />
                            <NavItem
                                setIsMenuOpen={setIsMenuOpen}
                                onClick={onCartClick}
                                icon={<ShoppingCart size={18} />}
                                label="My Cart"
                                badge={cartCount}
                            />
                            {isAuthenticated && (
                                <button onClick={() => { /* Implement if needed or use Header logic */ }} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors border-t border-gray-50 group">
                                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-500 flex items-center justify-center">
                                        <LogOut size={16} />
                                    </div>
                                    <span className="font-semibold text-red-600 text-[13px] flex-1 text-left">
                                        Sign Out
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-white border-t border-gray-100 rounded-tl-3xl mt-auto">
                    <div className="flex items-center justify-between text-gray-400">
                        <div className="flex items-center gap-2">
                            <img 
                                src="/assets/images/zada-logo.webp" 
                                alt="Zada Pharmacy" 
                                className="h-6 w-auto object-contain" 
                            />
                        </div>
                        <div className="flex gap-2 items-center bg-gray-50 px-2 py-1 rounded-md">
                            <Globe size={12} />
                            <span className="text-[10px] font-bold">EN</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MobileSideBar;

const NavItem = ({
    to,
    icon,
    label,
    badge,
    color = "text-gray-500 bg-gray-50",
    setIsMenuOpen,
    onClick,
}) => {
    const Component = onClick ? "button" : Link;
    return (
    <Component
        to={to}
        onClick={(e) => {
            setIsMenuOpen(false);
            if (onClick) onClick(e);
        }}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-primary-pale transition-colors border-b border-gray-50 last:border-b-0 group cursor-pointer text-left"
    >
        <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all ${color}`}
        >
            {icon}
        </div>
        <span className="font-semibold text-gray-700 group-hover:text-primary-dark text-[13px] flex-1 transition-colors">
            {label}
        </span>
        {badge > 0 ? (
            <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                {badge}
            </span>
        ) : (
            <ChevronRight
                size={16}
                className="text-gray-300 group-hover:text-primary transition-colors group-hover:translate-x-1"
            />
        )}
    </Component>
    );
};
