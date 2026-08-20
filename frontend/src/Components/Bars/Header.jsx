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
import { logout } from "../../store/slices/authSlice";
import MobileSideBar from "./MobileSideBar";

/* ─── Mega Menu Data Structure ─────────────────────────────────────── */
// (Now generated dynamically inside the Header component)
/* ─── NavIcon (Utility Component) ─────────────────────────────────── */
const NavIcon = ({ to, icon, label, badge }) => (
    <Link
        to={to}
        className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-[#74AA34] transition-colors relative group"
    >
        <div className="relative p-1.5 rounded-xl group-hover:bg-[#F4F8EE] transition-colors">
            {icon}
            {badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#74AA34] text-white text-[10px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center border-2 border-white">
                    {badge}
                </span>
            )}
        </div>
        <span className="text-[11px] font-semibold hidden lg:block">{label}</span>
    </Link>
);

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
                className="flex items-center justify-between gap-2 px-4 py-2.5 text-left text-xs font-semibold transition-colors bg-white hover:bg-[#F4F8EE] hover:text-[#74AA34] text-gray-700 w-full"
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userDropDownOpen, setUserDropDownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [activeMegaMenu, setActiveMegaMenu] = useState(null);
    const leaveTimer = useRef(null);
    const { getAllCategories } = useGetAllCategories();
    const { getMenus } = useGetMenus();
    const [dbCategories, setDbCategories] = useState([]);
    const [megaMenuData, setMegaMenuData] = useState([]);

    const cartItems = useSelector((state) => state.cart.items || []);
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { logoutUser } = useLogoutUser();
    const role = user?.role;

    useEffect(() => {
        (async () => {
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
            <div className="bg-[#1E5128] text-white py-1.5">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-[#D5EAC3]">
                        <Clock size={12} className="text-[#A6D76E] shrink-0" />
                        <span>Express 2-Hour Delivery in Karachi, Lahore &amp; Islamabad</span>
                    </div>
                    <div className="hidden sm:flex items-center divide-x divide-white/20 text-[11px] font-medium text-[#D5EAC3]">
                        <span className="flex items-center gap-1.5 pr-4">
                            <ShieldCheck size={12} className="text-[#A6D76E]" />
                            100% Genuine &amp; Licensed
                        </span>
                        <a href="tel:021111633422" className="flex items-center gap-1.5 pl-4 hover:text-white transition-colors">
                            <PhoneCall size={11} /> (021) 111-633-422
                        </a>
                    </div>
                </div>
            </div>

            {/* ── 2. MAIN HEADER BAR */}
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-2.5">
                <div className="flex items-center gap-4 lg:gap-6">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
                        <div className="w-9 h-9 bg-[#74AA34] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:bg-[#629329] transition-colors">
                            <span className="font-black text-base tracking-tight">M+</span>
                        </div>
                        <div className="hidden sm:flex flex-col">
                            <span className="font-extrabold text-[18px] text-gray-900 tracking-tight leading-tight">
                                Medi<span className="text-[#74AA34]">Care</span>
                            </span>
                            <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-[0.15em]">
                                Pharmacy &amp; Wellness
                            </span>
                        </div>
                    </Link>

                    {/* Search Bar */}
                    <div className="hidden md:flex flex-1">
                        <form onSubmit={handleSearch} className="flex w-full h-10 bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#74AA34] focus-within:ring-2 focus-within:ring-[#74AA34]/15 transition-all shadow-sm">
                            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="shrink-0 bg-gray-50 text-[11px] font-semibold text-gray-600 px-3 border-r border-gray-200 outline-none cursor-pointer hover:text-[#74AA34] transition-colors">
                                <option value="all">All Categories</option>
                                <option value="Medicines">Medicines</option>
                                <option value="Baby">Baby Care</option>
                                <option value="Nutrition">Nutrition</option>
                                <option value="Personal">Personal Care</option>
                                <option value="OTC">OTC Needs</option>
                            </select>
                            <div className="flex items-center flex-1 px-3 gap-2">
                                <Search size={15} className="text-gray-400 shrink-0" />
                                <input type="text" placeholder="Search medicines, vitamins, baby care..." className="flex-1 text-[13px] text-gray-900 placeholder:text-gray-400 outline-none bg-transparent" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                            <button type="submit" className="shrink-0 px-5 bg-[#74AA34] text-white text-[11px] font-extrabold uppercase tracking-wider hover:bg-[#629329] transition-colors cursor-pointer">
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Right Actions */}
                    <div className="hidden md:flex items-center gap-1 ml-auto shrink-0">
                        <Link to="/upload-prescription" className="hidden xl:inline-flex items-center gap-1.5 mr-2 px-3 py-1.5 rounded-lg bg-[#EDF6E5] text-[#3E6913] hover:bg-[#74AA34] hover:text-white border border-[#C8E2AC] text-[11px] font-bold transition-all">
                            <FileText size={13} /> Upload Rx
                        </Link>
                        <NavIcon to="/wishlist" icon={<Heart size={18} />} label="Wishlist" />
                        <NavIcon to="/orders" icon={<Package size={18} />} label="Orders" />
                        <NavIcon to="/cart" icon={<ShoppingCart size={18} />} label="Cart" badge={cartCount} />
                        <div className="w-px h-7 bg-gray-200 mx-2" />

                        {isAuthenticated ? (
                            <div className="relative">
                                <button className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg border border-gray-200 hover:border-[#74AA34]/50 hover:bg-gray-50 transition-all cursor-pointer" onClick={() => setUserDropDownOpen(!userDropDownOpen)}>
                                    <div className="w-7 h-7 rounded-lg bg-[#EDF6E5] text-[#74AA34] flex items-center justify-center font-bold text-xs shrink-0">
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
                                                <Link to="/profile" className="flex gap-2 items-center text-xs font-semibold text-gray-700 hover:text-[#74AA34] hover:bg-[#F4F8EE] px-3 py-2 rounded-lg transition-colors" onClick={() => setUserDropDownOpen(false)}>
                                                    <User size={14} /> My Profile
                                                </Link>
                                                {role === "admin" && (
                                                    <Link to="/admin-dashboard" className="flex gap-2 items-center text-xs font-semibold text-gray-700 hover:text-[#74AA34] hover:bg-[#F4F8EE] px-3 py-2 rounded-lg transition-colors" onClick={() => setUserDropDownOpen(false)}>
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
                                <Link to="/login" className="text-[12px] font-bold text-gray-600 hover:text-[#74AA34] transition-colors px-2 py-1.5">Login</Link>
                                <Link to="/register" className="bg-[#74AA34] text-white px-4 py-1.5 rounded-lg text-[12px] font-bold hover:bg-[#629329] transition-colors shadow-sm">Sign Up</Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Hamburger */}
                    <button className="md:hidden ml-auto p-2 rounded-lg text-gray-600 hover:text-[#74AA34] hover:bg-[#F4F8EE] transition-all" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <Menu size={21} />
                    </button>
                </div>
            </div>

            {/* Mobile Search */}
            <div className="md:hidden px-4 pb-2.5">
                <form onSubmit={handleSearch} className="flex h-9 w-full bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#74AA34] transition-all">
                    <div className="flex items-center pl-3 text-gray-400"><Search size={14} /></div>
                    <input type="text" placeholder="Search medicines, health products..." className="flex-1 px-2 text-xs text-gray-900 outline-none bg-transparent" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <button type="submit" className="px-4 bg-[#74AA34] text-white text-[11px] font-bold">Go</button>
                </form>
            </div>

            <MobileSideBar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} isAuthenticated={isAuthenticated} cartCount={cartCount} />

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
                                                    ? "text-[#74AA34] border-[#74AA34]"
                                                    : "text-gray-600 hover:text-[#74AA34] border-transparent hover:border-[#74AA34]/30"
                                            }`}
                                    >
                                        {cat.name}
                                        {hasSubs && <ChevronDown size={12} className={`transition-transform duration-200 ${isActive ? "rotate-180 text-[#74AA34]" : "text-gray-400"}`} />}
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
        </header>
    );
};

export default Header;