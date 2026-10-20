import { useSavedUser } from "../hooks/useSavedUser.js";
import { useAddressLookup } from "../hooks/useAddressLookup.js";
import { validPosition, samePosition, savedRecipient, addressFields } from "../utils/location.js";
import { FormField, FieldLabel, FieldControl } from "../UI/FormField";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { usePlaceOrder } from "../api/hooks/orders.api";
import { useGetSettings } from "../api/hooks/settings.api";
import { useUpdateUser } from "../api/hooks/user.api";
import { consumeCheckoutItems } from "../store/slices/cartSlice";
import { loginSuccess } from "../store/slices/authSlice";
import {
    Truck,
    CreditCard,
    Wallet,
    ShieldCheck,
    ArrowLeft,
    Loader2,
    User,
    Phone,
    MapPin,
    Building,
    Home,
    Map
} from "lucide-react";
import LocationPicker from "../Components/LocationPicker.jsx";

const CheckoutPage = () => {
    const { items: allItems } = useSelector((state) => state.cart);
    const user = useSavedUser();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Only process selected items
    const items = allItems.filter((item) => item.selected);
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const { placeOrder, loading: isLoading } = usePlaceOrder();
    const { data: settingsData } = useGetSettings();

    const [formData, setFormData] = useState({
        recipient: {
            name: user?.name || "",
            street: user?.addresses?.[0]?.street || "",
            addressLine2: user?.addresses?.[0]?.addressLine2 || "",
            city: user?.addresses?.[0]?.city || "",
            state: user?.addresses?.[0]?.state || "",
            postalCode: user?.addresses?.[0]?.postalCode || "",
            country: user?.addresses?.[0]?.country || "",
            phone: user?.phone || "",
        },
        payment: {
            method: "COD",
            ispaid: false,
        },
        taxAmount: 0,
        shippingFee: 0,
        shippingMethod: "standard",
    });
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
    const [mapPosition, setMapPosition] = useState(() => validPosition(user?.addresses?.[0]));
    const [baseShippingFee, setBaseShippingFee] = useState(0);
    const [advShippingConfig, setAdvShippingConfig] = useState(null);
    const isFetchingAddress = useAddressLookup({ position: mapPosition, text: formData.recipient.street,
        savedPosition: user?.addresses?.[0], savedText: user?.addresses?.[0]?.street || "",
        onPosition: setMapPosition, onAddress: data => setFormData(prev => ({ ...prev, recipient: { ...prev.recipient, ...addressFields(data) } })) });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes("recipient.")) {
            const field = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                recipient: { ...prev.recipient, [field]: value },
            }));
        } else if (name.includes("payment.")) {
            const field = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                payment: { ...prev.payment, [field]: value },
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]:
                    name === "taxAmount" || name === "shippingFee"
                        ? Number(value)
                        : value,
            }));
        }
    };

    useEffect(() => {
        if (!settingsLoaded && settingsData?.settings) {
            const res = settingsData;
            const defaultFee = Number(res.settings.shippingFee) || 0;
            setBaseShippingFee(defaultFee);
            setAdvShippingConfig(res.settings.advancedShipping || null);

            setFormData((prev) => ({
                ...prev,
                taxAmount: Number(res.settings.taxAmount) || 0,
                shippingFee: defaultFee,
                shippingMethod: res.settings.shippingMethod || "standard",
            }));
            if (res.settings.paymentMethods && res.settings.paymentMethods.length > 0) {
                const activeMethods = res.settings.paymentMethods.filter(m => m.isActive);
                setAvailablePaymentMethods(activeMethods);
                // Auto-select first available method if COD is not explicitly kept
                if (activeMethods.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        payment: { ...prev.payment, method: activeMethods[0].title }
                    }));
                }
            }
            setSettingsLoaded(true);
        }
    }, [settingsLoaded, settingsData]);

    // Calculate distance between two coordinates in km using Haversine formula
    const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
        if (!validPosition({ lat: lat1, lng: lon1 }) || !validPosition({ lat: lat2, lng: lon2 })) return null;
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    // Calculate Advanced Shipping Fee
    useEffect(() => {
        if (!settingsLoaded) return;
        
        let calculatedFee = baseShippingFee;

        if (advShippingConfig) {
            const { calculationMethod, storeLocation, distanceRatePerKm, percentageRate, cityRates, conditionalOverride } = advShippingConfig;

            if (calculationMethod === "distance" && mapPosition && validPosition(storeLocation)) {
                const distanceKm = getDistanceFromLatLonInKm(storeLocation.lat, storeLocation.lng, mapPosition.lat, mapPosition.lng);
                if (distanceKm !== null) {
                    calculatedFee = distanceKm * (distanceRatePerKm || 0);
                }
            } else if (calculationMethod === "percentage") {
                calculatedFee = totalAmount * ((percentageRate || 0) / 100);
            } else if (calculationMethod === "city_based" && formData.recipient.city) {
                const normalizeCity = (name) => {
                    if (!name) return "";
                    return name.toLowerCase()
                        .replace(/\b(division|district|city|tehsil|town|cantt|cantonment)\b/g, "")
                        .replace(/\s+/g, " ")
                        .trim();
                };

                const currentCity = normalizeCity(formData.recipient.city);
                const matchedCity = (cityRates || []).find(cr => {
                    const ruleCity = normalizeCity(cr.city);
                    return currentCity === ruleCity || currentCity.includes(ruleCity) || ruleCity.includes(currentCity);
                });
                
                if (matchedCity) {
                    calculatedFee = matchedCity.fee;
                }
            }

            // Apply Conditional Override
            if (conditionalOverride?.enabled) {
                const threshold = conditionalOverride.orderValueThreshold || 0;
                if (conditionalOverride.operator === "greater_than" && totalAmount > threshold) {
                    calculatedFee = conditionalOverride.overrideFee || 0;
                } else if (conditionalOverride.operator === "less_than" && totalAmount < threshold) {
                    calculatedFee = conditionalOverride.overrideFee || 0;
                }
            }
        }

        // Only update if it actually changed to prevent infinite loops
        if (Math.round(calculatedFee) !== Math.round(formData.shippingFee)) {
            setFormData(prev => ({ ...prev, shippingFee: Math.round(calculatedFee) }));
        }
    }, [totalAmount, formData.recipient.city, mapPosition, advShippingConfig, settingsLoaded, baseShippingFee]);

    const hydratedUser = useRef(user?._id);
    useEffect(() => {
        if (!user || hydratedUser.current === user._id) return;
        hydratedUser.current = user._id;
        setFormData(prev => ({ ...prev, recipient: { ...savedRecipient(user), ...Object.fromEntries(Object.entries(prev.recipient).filter(([, value]) => value !== "" && value != null)) } }));
        setMapPosition(prev => prev || validPosition(user.addresses?.[0]));
    }, [user]);

    useEffect(() => {
        if (formData.shippingMethod === "pickup" && formData.shippingFee !== 0) {
            setFormData((prev) => ({ ...prev, shippingFee: 0 }));
        }
    }, [formData.shippingMethod, formData.shippingFee]);

    const [showAddressPrompt, setShowAddressPrompt] = useState(false);
    const [pendingOrderData, setPendingOrderData] = useState(null);
    const { updateUser } = useUpdateUser();

    // Initialize mapPosition securely from DB
    useEffect(() => {
        if (!user) return;
        setMapPosition(prev => {
            if (prev) return prev;
            if (validPosition(user.addresses?.[0])) {
                return { lat: user.addresses[0].lat, lng: user.addresses[0].lng };
            }
            return null;
        });
    }, [user]);

    const isDifferentLocation = () => {
        if (!user) return false;
        const dbAddr = user?.addresses?.[0];
        if (!dbAddr) return true;
        
        // Normalize strings to compare
        const currentStreet = (formData.recipient.street || "").trim();
        const dbStreet = (dbAddr.street || "").trim();
        
        if (currentStreet !== dbStreet) return true;
        
        if (!samePosition(mapPosition, dbAddr)) return true;

        return false;
    };

    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const loadingMessages = [
        "Verifying your order...",
        "Checking inventory...",
        "Processing details...",
        "Finalizing placement...",
        "Almost there..."
    ];

    useEffect(() => {
        let interval;
        if (isLoading) {
            interval = setInterval(() => {
                setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
            }, 1500);
        } else {
            setLoadingMessageIndex(0);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const processOrder = async (orderData, savePermanently) => {
        try {
            if (savePermanently && user) {
                const updatedUser = {
                    ...user,
                    addresses: [
                        {
                            ...(user.addresses?.[0] || {}),
                            street: orderData.recipient.street,
                            addressLine2: orderData.recipient.addressLine2,
                            city: orderData.recipient.city,
                            state: orderData.recipient.state,
                            postalCode: orderData.recipient.postalCode,
                            country: orderData.recipient.country,
                            lat: orderData.recipient.lat,
                            lng: orderData.recipient.lng,
                        },
                        ...(user.addresses?.slice(1) || [])
                    ]
                };
                const updateFormData = new FormData();
                updateFormData.append("data", JSON.stringify(updatedUser));
                const res = await updateUser({ userId: user._id, user: updateFormData });
                if (!res?.success || !res?.user) return;
                dispatch(loginSuccess(res.user));
            }

            const response = await placeOrder(orderData);
            if (response?.success && response?.order?._id) {
                dispatch(consumeCheckoutItems({ items: orderData.items }));

                navigate("/orders/success", {
                    state: { orderId: response.order._id },
                });
            }
        } catch (error) {
            console.error("Order failed:", error);
        } finally {
            setShowAddressPrompt(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Filter out mock products (like "fbt-1" from Frequently Bought Together) 
        // to prevent MongoDB cast errors on the backend
        const validItems = items.filter(item => /^[0-9a-fA-F]{24}$/.test(item._id));
        
        if (validItems.length === 0) {
            alert("Your cart only contains mock products. Please add real products.");
            return;
        }

        const formattedItems = validItems.map((item) => ({
            product: item._id,
            quantity: item.quantity,
            price: item.price,
            totalAmount: item.totalPrice,
        }));

        const validTotalAmount = validItems.reduce((sum, item) => sum + item.totalPrice, 0);

        const orderData = {
            userId: user?._id,
            recipient: {
                ...formData.recipient,
                lat: mapPosition?.lat,
                lng: mapPosition?.lng,
            },
            items: formattedItems,
            taxAmount: Number(formData.taxAmount) || 0,
            shippingFee: Number(formData.shippingFee) || 0,
            shippingMethod: formData.shippingMethod,
            grandTotal:
                (validTotalAmount || 0) +
                (Number(formData.taxAmount) || 0) +
                (Number(formData.shippingFee) || 0),
            payment: formData.payment,
            status: "pending",
        };

        if (user && isDifferentLocation()) {
            setPendingOrderData(orderData);
            setShowAddressPrompt(true);
        } else {
            processOrder(orderData, false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-[85vh] flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="w-24 h-24 bg-primary-pale rounded-full flex items-center justify-center mb-6">
                    <Wallet className="text-primary-dark" size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">
                    Checkout is empty
                </h2>
                <p className="text-gray-500 font-bold mb-8 text-center max-w-sm">
                    You haven't selected any items for checkout yet. Let's find something you need!
                </p>
                <Link
                    to="/products"
                    className="bg-primary text-white px-8 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                    Browse Medicines
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-[85vh] py-8 lg:py-12">
            <div className="container mx-auto px-4 max-w-[1200px]">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-8">
                    <Link to="/cart" className="hover:text-primary transition-colors flex items-center gap-1.5">
                        <ArrowLeft size={14} /> Back to Cart
                    </Link>
                    <ChevronRightIcon />
                    <span className="text-primary-dark">Checkout</span>
                </div>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-primary-pale rounded-2xl flex items-center justify-center">
                        <ShieldCheck size={24} className="text-primary-dark" />
                    </div>
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">Secure Checkout</h1>
                        <p className="text-sm font-bold text-gray-500">Fast, safe, and secure transaction</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                        <form
                            id="checkout-form"
                            onSubmit={handleSubmit}
                            className="space-y-6"
                        >
                            {/* Shipping Information */}
                            <section className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 shadow-sm">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary-pale text-primary flex items-center justify-center">
                                        <Truck size={18} />
                                    </div>
                                    Delivery Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <CheckoutInput
                                        label="Full Name"
                                        name="recipient.name"
                                        icon={<User size={16} />}
                                        value={formData.recipient.name}
                                        onChange={handleChange}
                                        placeholder="Enter your name"
                                    />
                                    <CheckoutInput
                                        label="Phone Number"
                                        name="recipient.phone"
                                        icon={<Phone size={16} />}
                                        value={formData.recipient.phone}
                                        onChange={handleChange}
                                        placeholder="03XX-XXXXXXX"
                                    />
                                    
                                    {/* Map Picker */}
                                    <details className="md:col-span-2 rounded-xl border border-gray-200 p-3" open={advShippingConfig?.calculationMethod === "distance" || undefined}>
                                        <summary className="cursor-pointer py-2 text-sm font-semibold text-primary-dark">Choose a delivery pin on the map</summary>
                                        <div className="flex flex-col gap-3 pt-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                                                <span>Pin Exact Location</span>
                                                {isFetchingAddress && <Loader2 size={12} className="animate-spin text-primary" />}
                                            </span>
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
                                        <div className="rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm h-48 relative z-0">
                                            <LocationPicker position={mapPosition} setPosition={setMapPosition} className="h-full" />
                                        </div>
                                    </div>

                                    </details>
                                    <div className="md:col-span-2">
                                        <CheckoutInput
                                            label="Street Address"
                                            name="recipient.street"
                                            icon={<Home size={16} />}
                                            value={formData.recipient.street}
                                            onChange={handleChange}
                                            placeholder="House / Building No, Street Name"
                                        />
                                    </div>
                                    <CheckoutInput
                                        label="Apartment / Suite"
                                        name="recipient.addressLine2"
                                        icon={<Building size={16} />}
                                        value={formData.recipient.addressLine2}
                                        onChange={handleChange}
                                        placeholder="Apt 12B (Optional)"
                                        required={false}
                                    />
                                    <CheckoutInput
                                        label="City"
                                        name="recipient.city"
                                        icon={<MapPin size={16} />}
                                        value={formData.recipient.city}
                                        onChange={handleChange}
                                        placeholder="e.g. Karachi"
                                    />
                                    <CheckoutInput
                                        label="State / Province"
                                        name="recipient.state"
                                        icon={<Map size={16} />}
                                        value={formData.recipient.state}
                                        onChange={handleChange}
                                        placeholder="e.g. Sindh"
                                        required={false}
                                    />
                                    <CheckoutInput
                                        label="Postal Code"
                                        name="recipient.postalCode"
                                        icon={<MapPin size={16} />}
                                        value={formData.recipient.postalCode}
                                        onChange={handleChange}
                                        placeholder="e.g. 75000"
                                        required={false}
                                    />
                                </div>
                            </section>

                            {/* Payment Method */}
                            <section className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 shadow-sm">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary-pale text-primary flex items-center justify-center">
                                        <CreditCard size={18} />
                                    </div>
                                    Payment Method
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {availablePaymentMethods.length > 0 ? availablePaymentMethods.map((method, idx) => (
                                        <PaymentCard
                                            key={idx}
                                            active={formData.payment.method === method.title}
                                            onClick={() =>
                                                setFormData((p) => ({
                                                    ...p,
                                                    payment: {
                                                        ...p.payment,
                                                        method: method.title,
                                                    },
                                                }))
                                            }
                                            title={method.title}
                                            description={method.information}
                                            icon={
                                                method.image ? (
                                                    <img src={method.image} alt={method.title} className="w-6 h-6 object-contain" />
                                                ) : (
                                                    <CreditCard size={20} />
                                                )
                                            }
                                        />
                                    )) : (
                                        // Fallback if none configured
                                        <PaymentCard
                                            active={formData.payment.method === "COD"}
                                            onClick={() =>
                                                setFormData((p) => ({
                                                    ...p,
                                                    payment: { ...p.payment, method: "COD" },
                                                }))
                                            }
                                            title="Cash on Delivery"
                                            description="Pay when you receive"
                                            icon={<Wallet size={20} />}
                                        />
                                    )}
                                </div>
                            </section>
                        </form>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        <div className="bg-gray-900 rounded-3xl p-6 lg:p-8 text-white sticky top-28 shadow-xl shadow-gray-900/20">
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary-light mb-6">
                                Order Summary
                            </h3>
                            
                            <div className="space-y-4 mb-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {items.map((item) => (
                                    <div key={item._id} className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-white leading-snug line-clamp-2">
                                                {item.name}
                                            </p>
                                            <p className="text-xs font-bold text-gray-400">
                                                Qty: {item.quantity}
                                            </p>
                                        </div>
                                        <span className="text-sm font-black text-white whitespace-nowrap">
                                            Rs {item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 pt-6 border-t border-gray-700/50 mb-6">
                                <div className="flex justify-between text-sm font-bold text-gray-400">
                                    <span>Subtotal</span>
                                    <span className="text-white">Rs {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-gray-400">
                                    <span>Tax</span>
                                    <span className="text-white">Rs {Number(formData.taxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-gray-400">
                                    <span>Shipping</span>
                                    <span className="text-white">Rs {Number(formData.shippingFee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                
                                <div className="flex justify-between items-end pt-4 border-t border-gray-700/50 mt-2">
                                    <span className="text-sm font-bold text-gray-300">
                                        Grand Total
                                    </span>
                                    <span className="text-2xl font-black text-primary-light">
                                        Rs {((totalAmount || 0) + (Number(formData.taxAmount) || 0) + (Number(formData.shippingFee) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                form="checkout-form"
                                disabled={isLoading}
                                className="w-full bg-primary text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                            >
                                {isLoading ? (
                                    <><Loader2 className="animate-spin" size={18} /> Processing...</>
                                ) : (
                                    "Place Order"
                                )}
                            </button>

                            <div className="mt-5 flex items-center justify-center gap-2 text-gray-400">
                                <ShieldCheck size={14} className="text-primary-light" />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    Secure SSL Checkout
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Address Prompt Modal */}
            {showAddressPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="w-12 h-12 bg-primary-pale rounded-full flex items-center justify-center mb-5">
                            <MapPin className="text-primary" size={24} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mb-2">New Address Detected</h2>
                        <p className="text-sm font-bold text-gray-500 mb-8">
                            You've entered a delivery address that is different from your saved profile. Would you like to save this new address permanently?
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => processOrder(pendingOrderData, true)}
                                className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-primary-dark transition-all cursor-pointer"
                            >
                                Save Permanently & Order
                            </button>
                            <button
                                onClick={() => processOrder(pendingOrderData, false)}
                                className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all cursor-pointer"
                            >
                                Just for this Order
                            </button>
                            <button
                                onClick={() => setShowAddressPrompt(false)}
                                className="w-full bg-transparent text-gray-400 py-2 mt-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:text-gray-600 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Full Screen Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-primary-pale rounded-full flex items-center justify-center mb-6 relative">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                            <Loader2 className="text-primary animate-spin relative z-10" size={32} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mb-2">Processing Order</h2>
                        <p className="text-sm font-bold text-gray-500 animate-pulse">
                            {loadingMessages[loadingMessageIndex]}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Icon for breadcrumb
const ChevronRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
        <path d="m9 18 6-6-6-6"/>
    </svg>
);

const CheckoutInput = ({
    label,
    name,
    value,
    onChange,
    placeholder,
    icon,
    type = "text",
    required = true,
}) => (
    <FormField className="space-y-1.5 flex flex-col">
        <FieldLabel className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </FieldLabel>
        <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                {icon}
            </div>
            <FieldControl
                required={required}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-0 focus:border-primary focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-medium"
            />
        </div>
    </FormField>
);

const PaymentCard = ({ active, onClick, title, description, icon }) => (
    <div
        onClick={onClick}
        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${active
            ? "border-primary bg-primary-pale/30 shadow-md scale-[1.02]"
            : "border-gray-100 bg-white hover:border-primary-light hover:bg-gray-50"
            }`}
    >
        <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                active ? "bg-primary text-white shadow-sm" : "bg-gray-100 text-gray-400"
            }`}
        >
            {icon}
        </div>
        <div className="flex flex-col justify-center h-12">
            <p className={`font-black text-sm leading-tight ${active ? "text-primary-dark" : "text-gray-900"}`}>
                {title}
            </p>
            <p className="text-xs font-bold text-gray-500 mt-1">
                {description}
            </p>
        </div>
        {active && (
            <div className="ml-auto flex items-center h-12">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
                    <CheckCircle2Icon />
                </div>
            </div>
        )}
    </div>
);

const CheckCircle2Icon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5"/>
    </svg>
);

export default CheckoutPage;