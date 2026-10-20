import { useSavedUser } from "../hooks/useSavedUser.js";
import { useAddressLookup } from "../hooks/useAddressLookup.js";
import { validPosition, addressFields } from "../utils/location.js";
import { FormField, FieldLabel, FieldControl } from "../UI/FormField";
import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { loginSuccess, logout } from "../store/slices/authSlice";
import { useUpdateUser, useLogoutUser } from "../api/hooks/user.api";
import {
    Clock,
    MapPin,
    Heart,
    Ticket,
    Edit3,
    Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LocationPicker from "../Components/LocationPicker.jsx";

const ProfilePage = () => {
    const user = useSavedUser();
    const [userData, setUserData] = useState(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { updateUser, loading: updateUserLoading } = useUpdateUser();
    const { logoutUser, loading: logoutLoading } = useLogoutUser({});

    const [mapPosition, setMapPosition] = useState(null);
    const hydratedUser = useRef(null);
    useEffect(() => {
        if (user && hydratedUser.current !== user._id) {
            hydratedUser.current = user._id;
            setUserData(user); setMapPosition(validPosition(user.addresses?.[0]));
        }
    }, [user]);
    const isFetchingAddress = useAddressLookup({ position: mapPosition, text: userData?.addresses?.[0]?.street || "",
        savedPosition: user?.addresses?.[0], savedText: user?.addresses?.[0]?.street || "", onPosition: setMapPosition,
        onAddress: data => setUserData(prev => ({ ...prev, addresses: [{ ...(prev?.addresses?.[0] || {}), ...addressFields(data), ...mapPosition }, ...(prev?.addresses?.slice(1) || [])] })) });

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleAddressChange = (field, value) => {
        setUserData((prev) => ({
            ...prev,
            addresses: [
                {
                    ...(prev?.addresses?.[0] || {}),
                    [field]: value,
                },
                ...(prev?.addresses?.slice(1) || []),
            ],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("data", JSON.stringify({ ...userData, addresses: [{ ...(userData?.addresses?.[0] || {}), ...(mapPosition || {}) }, ...(userData?.addresses?.slice(1) || [])] }));

        const response = await updateUser({ userId: user._id, user: formData });

        if (response && response.user) {
            dispatch(loginSuccess(response.user));
            toast.success("Profile updated successfully!");
        }
    };

    const handleLogout = async () => {
        const response = await logoutUser();
        if (response?.success) {
            dispatch(logout());
            navigate("/");
            toast.success("Logged out successfully");
        }
    };

    if (!userData) return null;

    return (
        <div className="bg-white min-h-screen pb-20">
            <div className="site-shell pt-6">

                {/* Breadcrumbs */}
                <div className="text-sm font-medium mb-10 flex items-center gap-2">
                    <Link to="/" className="text-pink-500 hover:text-pink-600 transition-colors">Home</Link>
                    <span className="text-gray-400">›</span>
                    <span className="text-primary">user profile</span>
                </div>

                {/* Header Profile Info */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3">
                        {user?.name || "Guest User"}
                    </h1>
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl md:text-3xl font-medium text-primary">
                            {user?.phone || "No phone added"}
                        </h2>
                        {user?.phone && (
                            <span className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                                Verified
                            </span>
                        )}
                    </div>
                </div>

                {/* Quick Action Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
                    <Link to="/orders" className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-2xl hover:border-primary hover:shadow-md transition-all group">
                        <div className="w-14 h-14 bg-primary-pale/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Clock size={28} className="text-primary" />
                        </div>
                        <span className="text-sm font-bold text-gray-700 text-center">Order<br/>History</span>
                    </Link>
                    <Link to="/wishlist" className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-2xl hover:border-primary hover:shadow-md transition-all group">
                        <div className="w-14 h-14 bg-primary-pale/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Heart size={28} className="text-primary" />
                        </div>
                        <span className="text-sm font-bold text-gray-700 text-center">Saved<br/>Wishlist</span>
                    </Link>
                    <div
                        onClick={() => document.getElementById('address-section').scrollIntoView({ behavior: 'smooth' })}
                        className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-2xl hover:border-primary hover:shadow-md transition-all group cursor-pointer"
                    >
                        <div className="w-14 h-14 bg-primary-pale/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <MapPin size={28} className="text-primary" />
                        </div>
                        <span className="text-sm font-bold text-gray-700 text-center">Delivery<br/>Address</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-2xl hover:border-primary hover:shadow-md transition-all group cursor-pointer opacity-70">
                        <div className="w-14 h-14 bg-primary-pale/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Ticket size={28} className="text-primary" />
                        </div>
                        <span className="text-sm font-bold text-gray-700 text-center">My<br/>Vouchers</span>
                    </div>
                </div>

                {/* Editable Form */}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
                        <DVAGOInput
                            label="Full Name"
                            name="name"
                            value={userData?.name}
                            onChange={handleChange}
                        />
                        <DVAGOInput
                            label="Email"
                            name="email"
                            value={userData?.email}
                            onChange={handleChange}
                            disabled
                        />
                    </div>

                    <div id="address-section" className="pt-8 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex justify-between items-center">
                            Delivery Address
                            {isFetchingAddress && <Loader2 size={16} className="animate-spin text-primary" />}
                        </h3>

                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[13px] font-bold text-gray-900 ml-1">
                                    Pin Exact Location
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if ("geolocation" in navigator) {
                                            navigator.geolocation.getCurrentPosition(
                                                (pos) => setMapPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                                                () => alert("Unable to detect location. Allow location access or select a point on the map."),
                                                            { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
                                            );
                                        }
                                    }}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                                >
                                    <MapPin size={12} />
                                    Locate Me
                                </button>
                            </div>
                            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm h-64 relative z-0">
                                <LocationPicker position={mapPosition} setPosition={setMapPosition} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
                            <DVAGOInput
                                label="Street Address"
                                value={userData?.addresses?.[0]?.street}
                                onChange={(e) => handleAddressChange("street", e.target.value)}
                            />
                            <DVAGOInput
                                label="Apartment / Suite"
                                value={userData?.addresses?.[0]?.addressLine2}
                                onChange={(e) => handleAddressChange("addressLine2", e.target.value)}
                            />
                            <DVAGOInput
                                label="City"
                                value={userData?.addresses?.[0]?.city}
                                onChange={(e) => handleAddressChange("city", e.target.value)}
                            />
                            <DVAGOInput
                                label="State / Province"
                                value={userData?.addresses?.[0]?.state}
                                onChange={(e) => handleAddressChange("state", e.target.value)}
                            />
                            <DVAGOInput
                                label="Postal Code"
                                value={userData?.addresses?.[0]?.postalCode}
                                onChange={(e) => handleAddressChange("postalCode", e.target.value)}
                            />
                            <DVAGOInput
                                label="Country"
                                value={userData?.addresses?.[0]?.country}
                                onChange={(e) => handleAddressChange("country", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={updateUserLoading}
                            className="bg-primary hover:bg-primary-dark text-white px-10 py-3.5 rounded-lg font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            {updateUserLoading ? <Loader2 size={18} className="animate-spin" /> : "SAVE CHANGES"}
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={logoutLoading}
                            className="bg-red-50 hover:bg-red-100 text-red-500 px-10 py-3.5 rounded-lg font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            {logoutLoading ? <Loader2 size={18} className="animate-spin" /> : "LOGOUT"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

const DVAGOInput = ({ label, name, value, onChange, disabled }) => (
    <FormField className="flex flex-col gap-2">
        <FieldLabel className="text-[13px] font-bold text-gray-900 ml-1">
            {label}
        </FieldLabel>
        <div className="relative">
            <FieldControl
                name={name}
                value={value || ""}
                onChange={onChange}
                disabled={disabled}
                className={`w-full bg-[#FCFCFC] border border-gray-200 rounded-lg p-3.5 text-sm font-medium text-gray-700 outline-none focus:border-primary transition-colors ${
                    disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : ""
                }`}
                placeholder={`Enter your ${label.toLowerCase()}`}
            />
            {!disabled && (
                <Edit3 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
            )}
        </div>
    </FormField>
);

export default ProfilePage;
