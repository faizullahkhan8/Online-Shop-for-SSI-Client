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
} from "lucide-react";

import { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useLogoutUser } from "../../api/hooks/user.api";
import { useDispatch } from "react-redux";
import { logout } from "../../store/slices/authSlice";

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

    const colors = {
        primary: "#2563eb", // blue-600
        activeBg: "#dbeafe", // blue-100
        textMain: "#111827", // gray-900
        textMuted: "#6b7280", // gray-500
        border: "#e5e7eb", // gray-200
    };

    return (
        <Sidebar
            backgroundColor="white"
            collapsed={collapsed}
            rootStyles={{
                borderColor: colors.border,
                borderRightWidth: "1px",
                zIndex: "99",
                height: "100vh",
                position: "sticky",
                top: 0,
                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
            }}
        >
            {/* Logo Section */}
            <div className="relative flex items-center px-6 border-b border-gray-200 h-[72px]">
                {!collapsed ? (
                    <Link
                        to={"/"}
                        className="flex items-center gap-3 animate-in fade-in duration-300"
                    >
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <Globe className="text-white" size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-base text-gray-900">
                                E-Shop
                            </p>
                            <p className="text-xs text-gray-500">Admin Panel</p>
                        </div>
                    </Link>
                ) : (
                    ""
                )}

                <button
                    className="absolute right-6 top-6 bg-white border border-gray-200 rounded-lg p-1.5 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm z-50"
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
                            borderRadius: "8px",
                            margin: "2px 8px",
                            padding: "10px 12px",
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
                        className={`px-6 py-3 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wide transition-opacity ${collapsed ? "opacity-0" : "opacity-100"
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


                    {/* Logistics Section */}
                    <div
                        className={`px-6 py-3 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wide transition-opacity ${collapsed ? "opacity-0" : "opacity-100"
                            }`}
                    >
                        Logistics
                    </div>

                    <SubMenu
                        label="Orders"
                        icon={<ShoppingCart size={18} />}
                        defaultOpen={location.pathname.includes("orders")}
                    >
                        <MenuItem
                            component={<NavLink to="/admin-dashboard/orders" />}
                            icon={<ListIcon size={16} />}
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
                        className={`px-6 py-3 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wide transition-opacity ${collapsed ? "opacity-0" : "opacity-100"
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
                        component={<NavLink to="/admin-dashboard/hero" />}
                        icon={<MonitorPlay size={18} />}
                    >
                        Hero Content
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