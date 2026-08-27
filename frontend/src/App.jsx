import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import LoadingSpinner from "./Components/LoadingSpinner";
import ScrollToTop from "./Components/ScrollToTop";
import AboutPage from "./Pages/AboutUsPage";
import AdminLayout from "./Layout/AdminLayout.jsx";

const BaseLayout = lazy(() => import("./Layout/BaseLayout"));
const HomePage = lazy(() => import("./Pages/HomePage"));
const ProductListPage = lazy(() => import("./Pages/ProductListPage"));
const ProductDetailPage = lazy(() => import("./Pages/ProductDetailPage"));
const CartPage = lazy(() => import("./Pages/CartPage"));
const WishlistPage = lazy(() => import("./Pages/WishlistPage"));
const CheckoutPage = lazy(() => import("./Pages/CheckoutPage"));
const OrdersPage = lazy(() => import("./Pages/OrdersPage"));
const OrderSuccessPage = lazy(() => import("./Pages/OrderSuccessPage"));
const ProfilePage = lazy(() => import("./Pages/ProfilePage"));
const ProtectedRoute = lazy(() => import("./Components/Auth/ProtectedRoute"));
const ContactUsPage = lazy(() => import("./Pages/ContactUsPage"));
const PromotionsPage = lazy(() => import("./Pages/PromotionsPage.jsx"));
const UploadPrescription = lazy(() => import("./Pages/UploadPrescription"));
const StaffTreePage = lazy(() => import("./Pages/StaffTreePage"));

// Admin Pages
const DashboardPage = lazy(() => import("./Pages/Admin/DashboardPage"));
const ProductsListPage = lazy(() => import("./Pages/Admin/ProductsListPage"));
const AddProductPage = lazy(() => import("./Pages/Admin/AddProductPage"));
const TaxShippingPage = lazy(() => import("./Pages/Admin/TaxShippingPage"));
const CategoriesListPage = lazy(() => import("./Pages/Admin/CategoriesListPage"));
const VendorsListPage = lazy(() => import("./Pages/Admin/VendorsListPage"));
const OrdersListPage = lazy(() => import("./Pages/Admin/OrdersListPage"));
const OrderDetailsPage = lazy(() => import("./Pages/Admin/OrderDetailsPage"));
const AddOrderPage = lazy(() => import("./Pages/Admin/AddOrderPage"));
const UsersListPage = lazy(() => import("./Pages/Admin/UsersListPage"));
const AddUserPage = lazy(() => import("./Pages/Admin/AddUserPage"));
const AdminPromotionsPage = lazy(() => import("./Pages/Admin/PromotionsPage"));
const PromotionBuilderPage = lazy(() => import("./Pages/Admin/PromotionBuilderPage"));
const PrescriptionsListPage = lazy(() => import("./Pages/Admin/PrescriptionsList"));
const MenuBuilderPage = lazy(() => import("./Pages/Admin/MenuBuilderPage"));
const HomePageBuilderPage = lazy(() => import("./Pages/Admin/HomePageBuilderPage"));
const StaffTreeBuilderPage = lazy(() => import("./Pages/Admin/StaffTreeBuilderPage"));
const SmsTemplatesPage = lazy(() => import("./Pages/Admin/SmsTemplatesPage"));


const App = () => {
    return (
        <>
            <ScrollToTop />
            <ToastContainer
                position="top-right"
                autoClose={3000}
                pauseOnHover={false}
                closeOnClick={true}
            />
            <Suspense fallback={<LoadingSpinner message={"Loading..."} />}>
                <Routes>
                    <Route path="/" element={<BaseLayout />}>
                        <Route index element={<HomePage />} />
                        <Route path="products" element={<ProductListPage />} />
                        <Route path="contact-us" element={<ContactUsPage />} />
                        <Route path="about-us" element={<AboutPage />} />
                        <Route path="our-team" element={<StaffTreePage />} />
                        <Route path="promotions" element={<PromotionsPage />} />
                        <Route path="upload-prescription" element={<UploadPrescription />} />
                        <Route
                            path="product/:id"
                            element={<ProductDetailPage />}
                        />
                        <Route path="cart" element={<CartPage />} />
                        <Route
                            path="checkout"
                            element={
                                <ProtectedRoute roles={["user", "admin"]}>
                                    <CheckoutPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="wishlist"
                            element={
                                <ProtectedRoute roles={["user", "admin"]}>
                                    <WishlistPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="profile"
                            element={
                                <ProtectedRoute roles={["user", "admin"]}>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="orders"
                            element={
                                <ProtectedRoute roles={["user", "admin"]}>
                                    <OrdersPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="orders/success"
                            element={
                                <ProtectedRoute roles={["user", "admin"]}>
                                    <OrderSuccessPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="messages"
                            element={
                                <ProtectedRoute roles={["user", "admin"]}>
                                    <div className="p-8 text-center text-gray-500">
                                        Messages Page Placeholder
                                    </div>
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    {/* Admin Routes */}
                    <Route
                        path="/admin-dashboard"
                        element={
                            <ProtectedRoute roles={["admin"]}>
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<DashboardPage />} />
                        <Route path="products" element={<ProductsListPage />} />
                        <Route path="products/add" element={<AddProductPage />} />
                        <Route path="settings/tax-shipping" element={<TaxShippingPage />} />
                        <Route path="categories" element={<CategoriesListPage />} />
                        <Route path="vendors" element={<VendorsListPage />} />
                        <Route path="orders" element={<OrdersListPage />} />
                        <Route path="orders/:id" element={<OrderDetailsPage />} />
                        <Route path="orders/add" element={<AddOrderPage />} />
                        <Route path="users" element={<UsersListPage />} />
                        <Route path="users/add" element={<AddUserPage />} />
                        <Route path="promotions" element={<AdminPromotionsPage />} />
                        <Route path="promotions/create" element={<PromotionBuilderPage />} />
                        <Route path="menu-builder" element={<MenuBuilderPage />} />
                        <Route path="homepage-builder" element={<HomePageBuilderPage />} />
                        <Route path="staff-tree" element={<StaffTreeBuilderPage />} />
                        <Route path="sms-templates" element={<SmsTemplatesPage />} />
                        
                        {/* Prescriptions Management */}
                        <Route path="prescriptions" element={<PrescriptionsListPage />} />
                    </Route>
                </Routes>
            </Suspense>
        </>
    );
};

export default App;
