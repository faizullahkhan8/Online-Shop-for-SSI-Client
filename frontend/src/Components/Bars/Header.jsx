import {
    Search,
    User,
    ShoppingCart,
    Heart,
    Menu,
    LogOut,
    LayoutDashboard,
    ChevronDown,
    ChevronRight,
    Package,
    ShieldCheck,
    FileText,
    Clock,
    PhoneCall,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useLogoutUser } from "../../api/hooks/user.api";
import { useGetAllCategories } from "../../api/hooks/category.api";
import { useGetMenus } from "../../api/hooks/menu.api";
import { useGetHomePage } from "../../api/hooks/homepage.api";
import { logout } from "../../store/slices/authSlice";
import MobileSideBar from "./MobileSideBar";
import CartDrawer from "../CartDrawer";
import WishlistDrawer from "../WishlistDrawer";
import OrdersDrawer from "../OrdersDrawer";
import RegisterModal from "../Auth/RegisterModal";
import LoginModal from "../Auth/LoginModal";
import SearchModal from "../SearchModal";

/* ─── Mega Menu Data Structure ─────────────────────────────────────── */
// (Now generated dynamically inside the Header component)
/* ─── NavIcon (Utility Component) ─────────────────────────────────── */
const NavIcon = ({ to, icon, label, badge, onClick }) => {
    const Component = onClick ? "button" : Link;
    return (
        <Component
            to={to}
            onClick={onClick}
            className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-primary transition-colors relative group cursor-pointer"
        >
            <div className="relative p-1.5 rounded-xl group-hover:bg-primary-pale transition-colors">
                {icon}
                {badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center border-2 border-white">
                        {badge}
                    </span>
                )}
            </div>
            <span className="text-[11px] font-semibold hidden lg:block">{label}</span>
        </Component>
    );
};

/* ─── Recursive Cascading Menu Node ────────────────────────────────── */
const RecursiveMenuNode = ({ category, onClose }) => {
    const [isHovered, setIsHovered] = useState(false);
    const hasSubs = category.children?.length > 0;

    return (
        <div
            className="relative group/node"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link
                to={category.path}
                onClick={onClose}
                className="flex items-center justify-between gap-2 px-4 py-2.5 text-left text-xs font-semibold transition-colors bg-white hover:bg-primary-pale hover:text-primary text-gray-700 w-full"
            >
                <span className="truncate">{category.name}</span>
                {hasSubs && <ChevronRight size={13} className="text-gray-400 shrink-0" />}
            </Link>
            
            {hasSubs && isHovered && (
                <div className="absolute top-0 left-full -mt-[1px] ml-0 min-w-[200px] bg-white border border-gray-100 shadow-xl py-1 z-50">
                    {category.children.map(child => (
                        <RecursiveMenuNode key={child._id || child.name} category={child} onClose={onClose} />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ─── Header ───────────────────────────────────────────────────────── */
const Header = () => {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);
    const [isOrdersOpen, setIsOrdersOpen] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [userDropDownOpen, setUserDropDownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [activeMegaMenu, setActiveMegaMenu] = useState(null);
    const leaveTimer = useRef(null);
    const { getAllCategories } = useGetAllCategories();
    const { getMenus } = useGetMenus();
    const { getHomePage } = useGetHomePage();
    const [dbCategories, setDbCategories] = useState([]);
    const [megaMenuData, setMegaMenuData] = useState([]);
    const [topBarConfig, setTopBarConfig] = useState(null);

    const cartItems = useSelector((state) => state.cart.items || []);
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { logoutUser } = useLogoutUser();
    const role = user?.role;

    useEffect(() => {
        (async () => {
            const homeRes = await getHomePage().catch(() => null);
            if (homeRes?.sections) {
                const bar = homeRes.sections.find(s => s.type === "top_micro_bar" && s.isVisible !== false);
                if (bar) setTopBarConfig(bar.config);
            }

            const res = await getAllCategories();
            if (res?.success) setDbCategories(res.categories);
            
            const menuRes = await getMenus();
            if (menuRes?.success) {
                // Map API fields (title/link) to component expected fields (name/path)
                const mapMenuKeys = (nodes) => {
                    nodes.forEach(node => {
                        node.name = node.title;
                        node.path = node.link;
                        node.isHighlight = node.type === "PROMOTION";
                        if (node.children) mapMenuKeys(node.children);
                    });
                };
                
                // Fallback to empty array if no menus
                let dynamicMenu = menuRes.menus || [];
                mapMenuKeys(dynamicMenu);
                
                // If there are literally no menus created yet, we can show a placeholder or let it be empty
                if (dynamicMenu.length === 0) {
                     dynamicMenu.push({
                         name: "Special Offers",
                         path: "/promotions",
                         isHighlight: true,
                         children: [],
                     });
                }
                
                setMegaMenuData(dynamicMenu);
            }
        })();
    }, []);

    // Global keyboard shortcut (Ctrl+K / Cmd+K) to open search modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setIsSearchModalOpen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchQuery?.trim()) params.append("search", searchQuery.trim());
        if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
        const queryString = params.toString();
        navigate(queryString ? `/products?${queryString}` : "/products");
    };

    const handleSignOut = async () => {
        const response = await logoutUser();
        if (response.success) {
            dispatch(logout());
            setUserDropDownOpen(false);
            navigate("/");
        }
    };

    const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

    // Hover delay helpers — prevents flicker on mouse travel
    const handleCatEnter = (catName) => {
        clearTimeout(leaveTimer.current);
        setActiveMegaMenu(catName);
    };

    const handleCatLeave = () => {
        leaveTimer.current = setTimeout(() => setActiveMegaMenu(null), 120);
    };

    return (
        <header className="bg-white z-50 shadow-sm border-b border-gray-100 sticky top-0">

            {/* ── 1. TOP MICRO BAR */}
            {topBarConfig ? (
                <div style={{ backgroundColor: topBarConfig.bgColor, color: topBarConfig.textColor }} className="py-1.5 transition-colors">
                    <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
                        {topBarConfig.style === "marquee" ? (
                            <div className="marquee-container overflow-hidden w-full flex items-center">
                                <div className="animate-marquee flex items-center gap-8 whitespace-nowrap text-[11px] font-bold tracking-wide">
                                    <span>{topBarConfig.textLeft}</span>
                                    <span>{topBarConfig.textLeft}</span>
                                    <span>{topBarConfig.textLeft}</span>
                                </div>
                            </div>
                        ) : topBarConfig.style === "centered" ? (
                            <div className="text-center text-[11px] font-bold tracking-wide">
                                {topBarConfig.textLeft}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between text-[11px] font-bold">
                                <div className="flex items-center gap-2">
                                    <Clock size={12} className="opacity-80 shrink-0" />
                                    <span>{topBarConfig.textLeft}</span>
                                </div>
                                <div className="hidden sm:flex items-center divide-x divide-white/20">
                                    <span className="flex items-center gap-1.5 pr-4 opacity-90">
                                        <ShieldCheck size={12} />
                                        {topBarConfig.textMiddle}
                                    </span>
                                    <a href={`tel:${topBarConfig.phone?.replace(/\D/g, '')}`} className="flex items-center gap-1.5 pl-4 hover:opacity-100 transition-opacity opacity-90">
                                        <PhoneCall size={11} /> {topBarConfig.phone}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-primary-dark text-white py-1.5">
                    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11px] font-medium text-primary-pale">
                            <Clock size={12} className="text-primary-light shrink-0" />
                            <span>Express 2-Hour Delivery in Karachi, Lahore &amp; Islamabad</span>
                        </div>
                        <div className="hidden sm:flex items-center divide-x divide-white/20 text-[11px] font-medium text-primary-pale">
                            <span className="flex items-center gap-1.5 pr-4">
                                <ShieldCheck size={12} className="text-primary-light" />
                                100% Genuine &amp; Licensed
                            </span>
                            <a href="tel:021111633422" className="flex items-center gap-1.5 pl-4 hover:text-white transition-colors">
                                <PhoneCall size={11} /> (021) 111-633-422
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 2. MAIN HEADER BAR */}
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-2.5">
                <div className="flex items-center gap-4 lg:gap-6">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
                        <img 
                            src="/assets/images/zada-logo.webp" 
                            alt="Zada Pharmacy" 
                            className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105" 
                        />
                    </Link>

                    {/* Search Bar Trigger */}
                    <div className="hidden md:flex flex-1 max-w-2xl">
                        <div
                            onClick={() => setIsSearchModalOpen(true)}
                            className="flex w-full h-10.5 bg-gray-50/80 hover:bg-gray-50 border border-gray-200 hover:border-primary/50 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 rounded-xl overflow-hidden transition-all shadow-2xs cursor-pointer group items-center justify-between"
                        >
                            <div className="flex items-center flex-1 px-3.5 gap-2.5">
                                <Search size={16} className="text-gray-400 group-hover:text-primary transition-colors shrink-0" />
                                <span className="text-[13px] text-gray-400 group-hover:text-gray-600 transition-colors">
                                    Search for Medicines & more...
                                </span>
                            </div>
                            <div className="flex items-center gap-2 pr-1.5">
                                <span className="hidden lg:inline-flex text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-2xs">
                                    Ctrl K
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSearchModalOpen(true);
                                    }}
                                    className="px-4 py-1.5 bg-primary text-white text-[11px] font-extrabold uppercase tracking-wider rounded-lg group-hover:bg-primary-dark transition-colors cursor-pointer"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="hidden md:flex items-center gap-1 ml-auto shrink-0">
                        <Link to="/upload-prescription" className="hidden xl:inline-flex items-center gap-1.5 mr-2 px-3 py-1.5 rounded-lg bg-primary-pale text-primary-dark hover:bg-primary hover:text-white border border-primary-light text-[11px] font-bold transition-all">
                            <FileText size={13} /> Upload Rx
                        </Link>
                        <NavIcon onClick={() => setIsWishlistOpen(true)} icon={<Heart size={18} />} label="Wishlist" />
                        <NavIcon onClick={() => setIsOrdersOpen(true)} icon={<Package size={18} />} label="Orders" />
                        <NavIcon onClick={() => setIsCartOpen(true)} icon={<ShoppingCart size={18} />} label="Cart" badge={cartCount} />
                        <div className="w-px h-7 bg-gray-200 mx-2" />

                        {isAuthenticated ? (
                            <div className="relative">
                                <button className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg border border-gray-200 hover:border-primary/50 hover:bg-gray-50 transition-all cursor-pointer" onClick={() => setUserDropDownOpen(!userDropDownOpen)}>
                                    <div className="w-7 h-7 rounded-lg bg-primary-pale text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
                                    </div>
                                    <span className="text-[11px] font-semibold text-gray-700 hidden lg:block max-w-[72px] truncate">{user?.name?.split(" ")[0] || "Account"}</span>
                                    <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${userDropDownOpen ? "rotate-180" : ""}`} />
                                </button>
                                {userDropDownOpen && (
                                    <>
                                        <div onClick={() => setUserDropDownOpen(false)} className="fixed inset-0 z-40" />
                                        <div className="absolute top-full right-0 mt-2 w-52 rounded-xl bg-white shadow-xl border border-gray-100 p-1.5 z-50">
                                            <div className="px-3 py-2 mb-1">
                                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Signed in as</p>
                                                <p className="text-xs font-bold text-gray-900 truncate mt-0.5">{user?.name || "User"}</p>
                                            </div>
                                            <div className="border-t border-gray-100 pt-1">
                                                <Link to="/profile" className="flex gap-2 items-center text-xs font-semibold text-gray-700 hover:text-primary hover:bg-primary-pale px-3 py-2 rounded-lg transition-colors" onClick={() => setUserDropDownOpen(false)}>
                                                    <User size={14} /> My Profile
                                                </Link>
                                                {role === "admin" && (
                                                    <Link to="/admin-dashboard" className="flex gap-2 items-center text-xs font-semibold text-gray-700 hover:text-primary hover:bg-primary-pale px-3 py-2 rounded-lg transition-colors" onClick={() => setUserDropDownOpen(false)}>
                                                        <LayoutDashboard size={14} /> Admin Dashboard
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="border-t border-gray-100 pt-1 mt-1">
                                                <button onClick={handleSignOut} className="w-full flex gap-2 items-center text-xs font-semibold text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors cursor-pointer">
                                                    <LogOut size={14} /> Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsLoginOpen(true)} className="text-[12px] font-bold text-gray-600 hover:text-primary transition-colors px-2 py-1.5 cursor-pointer">Login</button>
                                <button onClick={() => setIsRegisterOpen(true)} className="bg-primary text-white px-4 py-1.5 rounded-lg text-[12px] font-bold hover:bg-primary-dark transition-colors shadow-sm cursor-pointer">Sign Up</button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Hamburger */}
                    <button className="md:hidden ml-auto p-2 rounded-lg text-gray-600 hover:text-primary hover:bg-primary-pale transition-all" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <Menu size={21} />
                    </button>
                </div>
            </div>

            {/* Mobile Search */}
            <div className="md:hidden px-4 pb-2.5">
                <div
                    onClick={() => setIsSearchModalOpen(true)}
                    className="flex h-9 w-full bg-gray-50 border border-gray-200 rounded-xl overflow-hidden items-center px-3 gap-2 cursor-pointer shadow-2xs"
                >
                    <Search size={14} className="text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-400 flex-1 truncate">Search for Medicines & more...</span>
                    <span className="px-2.5 py-0.5 rounded bg-primary text-white text-[10px] font-bold">Search</span>
                </div>
            </div>

            <MobileSideBar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} isAuthenticated={isAuthenticated} cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} onWishlistClick={() => setIsWishlistOpen(true)} onOrdersClick={() => setIsOrdersOpen(true)} onRegisterClick={() => setIsRegisterOpen(true)} onLoginClick={() => setIsLoginOpen(true)} />

            {/* ── 3. MEGA NAV STRIP */}
            <div className="hidden md:block border-t border-gray-100 bg-white relative z-40">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
                    <nav className="flex flex-wrap items-center justify-start gap-y-1">
                        {megaMenuData.map((cat) => {
                            const isActive = activeMegaMenu === cat.name;
                            const hasSubs = cat.children?.length > 0;
                            const isCurrent = location.pathname + location.search === cat.path;
                            return (
                                <div key={cat.name} className="relative" onMouseEnter={() => hasSubs && handleCatEnter(cat.name)} onMouseLeave={handleCatLeave}>
                                    <Link
                                        to={cat.path}
                                        className={`flex items-center gap-1 px-2 lg:px-3 py-2.5 text-[12px] font-bold whitespace-nowrap transition-all border-b-2 ${cat.isHighlight
                                                ? "text-red-500 hover:text-red-600 border-transparent"
                                                : isActive || isCurrent
                                                    ? "text-primary border-primary"
                                                    : "text-gray-600 hover:text-primary border-transparent hover:border-primary/30"
                                            }`}
                                    >
                                        {cat.name}
                                        {hasSubs && <ChevronDown size={12} className={`transition-transform duration-200 ${isActive ? "rotate-180 text-primary" : "text-gray-400"}`} />}
                                    </Link>
                                    
                                    {/* ── Level 1 Dropdown ── */}
                                    {hasSubs && (
                                        <div 
                                            className={`absolute top-full left-0 mt-0 min-w-[220px] bg-white border border-gray-100 shadow-2xl py-1 z-50 transition-all duration-200 origin-top ${
                                                isActive ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"
                                            }`}
                                            onMouseLeave={() => setActiveMegaMenu(null)}
                                        >
                                            {cat.children.map(child => (
                                                <RecursiveMenuNode key={child._id || child.name} category={child} onClose={() => setActiveMegaMenu(null)} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>
            </div>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
            <OrdersDrawer isOpen={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} />
            
            <SearchModal 
                isOpen={isSearchModalOpen} 
                onClose={() => setIsSearchModalOpen(false)} 
            />

            <RegisterModal 
                isOpen={isRegisterOpen} 
                onClose={() => setIsRegisterOpen(false)} 
                onSwitchToLogin={() => { 
                    setIsRegisterOpen(false); 
                    setIsLoginOpen(true); 
                }} 
            />

            <LoginModal 
                isOpen={isLoginOpen} 
                onClose={() => setIsLoginOpen(false)} 
                onSwitchToRegister={() => { 
                    setIsLoginOpen(false); 
                    setIsRegisterOpen(true); 
                }} 
            />
        </header>
    );
};

export default Header;
