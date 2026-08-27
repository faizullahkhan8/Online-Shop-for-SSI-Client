import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import {
    LayoutDashboard,
    Package,
    Plus,
    List as ListIcon,
    Users,
    ShoppingCart,
    Layers,
    ChevronLeft,
    ChevronRight,
    LayoutDashboardIcon,
    Globe,
    Receipt,
    LogOut,
    Loader2,
    Percent,
    MonitorPlay,
    FileText,
    ListTree,
    LayoutTemplate,
    Building2,
    MessageSquare,
} from "lucide-react";

import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useLogoutUser } from "../../api/hooks/user.api";
import { useGetUnreadOrdersCount } from "../../api/hooks/orders.api";
import { useGetUnreadPrescriptionsCount } from "../../api/hooks/prescription.api";
import { useDispatch } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import { useSocket } from "../../context/SocketContext";

const AdminSidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    const { logoutUser, loading } = useLogoutUser({});
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        const response = await logoutUser();
        if (response.success) {
            dispatch(logout());
            navigate("/");
        }
    };

    const { getUnreadCount: fetchOrdersCount, count: unreadOrders } = useGetUnreadOrdersCount();
    const { getUnreadCount: fetchPrescriptionsCount, count: unreadPrescriptions } = useGetUnreadPrescriptionsCount();
    const { socket, SOCKET_EVENTS } = useSocket();

    // Fetch counts periodically or on load
    useEffect(() => {
        fetchOrdersCount();
        fetchPrescriptionsCount();
        
        // Set up polling every 30 seconds as background fallback
        const interval = setInterval(() => {
            fetchOrdersCount();
            fetchPrescriptionsCount();
        }, 30000);
        
        return () => clearInterval(interval);
    }, [fetchOrdersCount, fetchPrescriptionsCount]);

    // Instant real-time updates when new orders or prescriptions arrive
    useEffect(() => {
        if (!socket) return;

        const handleRefresh = () => {
            fetchOrdersCount();
            fetchPrescriptionsCount();
        };

        socket.on(SOCKET_EVENTS.ORDER_NEW, handleRefresh);
        socket.on(SOCKET_EVENTS.ORDER_STATUS_UPDATED, handleRefresh);
        socket.on(SOCKET_EVENTS.PRESCRIPTION_NEW, handleRefresh);
        socket.on(SOCKET_EVENTS.PRESCRIPTION_STATUS_UPDATED, handleRefresh);

        return () => {
            socket.off(SOCKET_EVENTS.ORDER_NEW, handleRefresh);
            socket.off(SOCKET_EVENTS.ORDER_STATUS_UPDATED, handleRefresh);
            socket.off(SOCKET_EVENTS.PRESCRIPTION_NEW, handleRefresh);
            socket.off(SOCKET_EVENTS.PRESCRIPTION_STATUS_UPDATED, handleRefresh);
        };
    }, [socket, fetchOrdersCount, fetchPrescriptionsCount, SOCKET_EVENTS]);

    const colors = {
        primary: "#4d8d3a", // primary green
        activeBg: "#ebf7d9", // primary-pale
        textMain: "#111827", // gray-900
        textMuted: "#6b7280", // gray-500
        border: "#e5e7eb", // gray-200
    };

    return (
        <Sidebar
            backgroundColor="white"
            collapsed={collapsed}
            rootStyles={{
                borderRightWidth: "0px",
                zIndex: "40",
                height: "100vh",
                position: "sticky",
                top: 0,
                boxShadow: "4px 0 24px -4px rgb(0 0 0 / 0.08)",
                borderTopRightRadius: "24px",
                borderBottomRightRadius: "24px",
            }}
        >
            {/* Logo Section */}
            <div className="relative flex items-center px-6 border-b border-gray-200 h-[72px]">
                {!collapsed ? (
                    <Link
                        to={"/"}
                        className="flex items-center gap-3 animate-in fade-in duration-300"
                    >
                        <img 
                            src="/assets/images/zada-logo.webp" 
                            alt="Zada Pharmacy" 
                            className="h-8 w-auto object-contain" 
                        />
                    </Link>
                ) : (
                    ""
                )}

                <button
                    className="absolute right-6 top-6 bg-white border border-gray-200 rounded-lg p-1.5 text-gray-400 hover:text-primary hover:border-primary-light transition-all shadow-sm z-50"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? (
                        <ChevronRight size={14} />
                    ) : (
                        <ChevronLeft size={14} />
                    )}
                </button>
            </div>

            {/* Menu Section */}
            <div className="py-4 px-2">
                <Menu
                    menuItemStyles={{
                        button: ({ active }) => ({
                            fontSize: "14px",
                            fontWeight: active ? "600" : "500",
                            color: active ? colors.primary : colors.textMain,
                            backgroundColor: active
                                ? colors.activeBg
                                : "transparent",
                            borderRadius: "12px",
                            margin: "4px 12px",
                            padding: "12px 14px",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                backgroundColor: colors.activeBg,
                                color: colors.primary,
                            },
                        }),
                        icon: ({ active }) => ({
                            color: active ? colors.primary : colors.textMuted,
                            marginRight: "8px",
                        }),
                        subMenuContent: {
                            marginLeft: "20px"
                        },
                    }}
                >
                    <MenuItem
                        component={<NavLink to="/admin-dashboard" />}
                        icon={<LayoutDashboard size={18} />}
                    >
                        Dashboard
                    </MenuItem>

                    {/* Inventory Section */}
                    <div
                        className={`px-8 py-4 mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest transition-opacity ${collapsed ? "opacity-0" : "opacity-100"
                            }`}
                    >
                        Inventory
                    </div>

                    <SubMenu
                        label="Products"
                        icon={<Package size={18} />}
                        defaultOpen={
                            location.pathname.includes("products") ||
                            location.pathname.includes("settings")
                        }
                    >
                        <MenuItem
                            component={
                                <NavLink to="/admin-dashboard/products" />
                            }
                            icon={<ListIcon size={16} />}
                        >
                            All Products
                        </MenuItem>
                        <MenuItem
                            component={
                                <NavLink to="/admin-dashboard/products/add" />
                            }
                            icon={<Plus size={16} />}
                        >
                            Add Product
                        </MenuItem>
                        <MenuItem
                            component={
                                <NavLink to="/admin-dashboard/settings/tax-shipping" />
                            }
                            icon={<Receipt size={16} />}
                        >
                            Tax & Shipping
                        </MenuItem>
                    </SubMenu>

                    <SubMenu
                        label="Categories"
                        icon={<Layers size={18} />}
                        defaultOpen={location.pathname.includes("categories")}
                    >
                        <MenuItem
                            component={
                                <NavLink to="/admin-dashboard/categories" />
                            }
                            icon={<ListIcon size={16} />}
                        >
                            All Categories
                        </MenuItem>
                    </SubMenu>

                    <SubMenu
                        label="Vendors"
                        icon={<Building2 size={18} />}
                        defaultOpen={location.pathname.includes("vendors")}
                    >
                        <MenuItem
                            component={
                                <NavLink to="/admin-dashboard/vendors" />
                            }
                            icon={<ListIcon size={16} />}
                        >
                            All Vendors
                        </MenuItem>
                    </SubMenu>


                    {/* Logistics Section */}
                    <div
                        className={`px-8 py-4 mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest transition-opacity ${collapsed ? "opacity-0" : "opacity-100"
                            }`}
                    >
                        Logistics
                    </div>

                    <SubMenu
                        label="Orders"
                        icon={<ShoppingCart size={18} />}
                        defaultOpen={location.pathname.includes("orders")}
                        suffix={
                            unreadOrders > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[20px] mr-2">
                                    {unreadOrders > 99 ? '99+' : unreadOrders}
                                </span>
                            )
                        }
                    >
                        <MenuItem
                            component={<NavLink to="/admin-dashboard/orders" />}
                            icon={<ListIcon size={16} />}
                            suffix={
                                unreadOrders > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[20px]">
                                        {unreadOrders > 99 ? '99+' : unreadOrders}
                                    </span>
                                )
                            }
                        >
                            All Orders
                        </MenuItem>
                        <MenuItem
                            component={
                                <NavLink to="/admin-dashboard/orders/add" />
                            }
                            icon={<Plus size={16} />}
                        >
                            Add Manual Order
                        </MenuItem>
                    </SubMenu>

                    <MenuItem
                        component={<NavLink to="/admin-dashboard/prescriptions" />}
                        icon={<FileText size={18} />}
                        suffix={
                            unreadPrescriptions > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[20px]">
                                    {unreadPrescriptions > 99 ? '99+' : unreadPrescriptions}
                                </span>
                            )
                        }
                    >
                        Prescriptions
                    </MenuItem>

                    <SubMenu
                        label="Users"
                        icon={<Users size={18} />}
                        defaultOpen={location.pathname.includes("users")}
                    >
                        <MenuItem
                            component={<NavLink to="/admin-dashboard/users" />}
                            icon={<ListIcon size={16} />}
                        >
                            All Users
                        </MenuItem>
                        <MenuItem
                            component={
                                <NavLink to="/admin-dashboard/users/add" />
                            }
                            icon={<Plus size={16} />}
                        >
                            Add User
                        </MenuItem>
                    </SubMenu>

                    {/* Marketing Section */}
                    <div
                        className={`px-8 py-4 mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest transition-opacity ${collapsed ? "opacity-0" : "opacity-100"
                            }`}
                    >
                        Marketing
                    </div>

                    <MenuItem
                        component={<NavLink to="/admin-dashboard/promotions" />}
                        icon={<Percent size={18} />}
                    >
                        Promotions
                    </MenuItem>



                    <MenuItem
                        component={<NavLink to="/admin-dashboard/menu-builder" />}
                        icon={<ListTree size={18} />}
                    >
                        Menu Builder
                    </MenuItem>

                    <MenuItem
                        component={<NavLink to="/admin-dashboard/homepage-builder" />}
                        icon={<LayoutTemplate size={18} />}
                    >
                        Page Builder
                    </MenuItem>

                    <MenuItem
                        component={<NavLink to="/admin-dashboard/staff-tree" />}
                        icon={<Users size={18} />}
                    >
                        Staff Tree Builder
                    </MenuItem>

                    <MenuItem
                        component={<NavLink to="/admin-dashboard/sms-templates" />}
                        icon={<MessageSquare size={18} />}
                    >
                        SMS Templates
                    </MenuItem>

                    {/* Bottom Actions */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <MenuItem
                            component={<Link to={"/"} />}
                            icon={<Globe size={16} />}
                        >
                            Visit Site
                        </MenuItem>
                        <MenuItem
                            onClick={handleSignOut}
                            icon={
                                loading ? (
                                    <Loader2
                                        size={16}
                                        className="animate-spin text-red-500"
                                    />
                                ) : (
                                    <LogOut size={16} className="rotate-180" />
                                )
                            }
                        >
                            {loading ? (
                                <span className="text-red-500">Logging out...</span>
                            ) : (
                                "Logout"
                            )}
                        </MenuItem>
                    </div>
                </Menu>
            </div>
        </Sidebar>
    );
};

export default AdminSidebar;