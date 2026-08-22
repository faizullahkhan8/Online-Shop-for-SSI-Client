import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUploadPrescription } from "../api/hooks/prescription.api.js";
import { toast } from "react-toastify";
import {
    ChevronRight,
    UploadCloud,
    CheckCircle2,
    Image as ImageIcon,
    Loader,
    MapPin,
    User,
    Phone,
    X,
    FileText,
    AlertCircle
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import LocationPicker from "../Components/LocationPicker.jsx";
import { useUpdateUser } from "../api/hooks/user.api";
import { loginSuccess } from "../store/slices/authSlice";

const UploadPrescription = () => {
    const [imagePreview, setImagePreview] = useState(null);
    const [file, setFile] = useState(null);
    
    const { uploadPrescription, loading } = useUploadPrescription();
    const { updateUser } = useUpdateUser();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    
    // Auto-fill from DB address if available
    const [addressText, setAddressText] = useState(() => {
        if (user?.addresses?.[0]) {
            const addr = user.addresses[0];
            return [addr.street, addr.city, addr.country].filter(Boolean).join(", ");
        }
        return "";
    });
    
    const [mapPosition, setMapPosition] = useState(
        user?.addresses?.[0]?.lat && user?.addresses?.[0]?.lng 
            ? { lat: user.addresses[0].lat, lng: user.addresses[0].lng } 
            : null
    );
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);
    const lastReverseGeocodedAddress = useRef("");

    useEffect(() => {
        const fetchAddress = async () => {
            if (!mapPosition) return;
            setIsFetchingAddress(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${mapPosition.lat}&lon=${mapPosition.lng}`
                );
                const data = await response.json();
                if (data && data.display_name) {
                    lastReverseGeocodedAddress.current = data.display_name;
                    setAddressText(data.display_name);
                }
            } catch (error) {
                console.error("Error fetching address:", error);
            } finally {
                setIsFetchingAddress(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchAddress();
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [mapPosition]);

    // Forward Geocoding: Update map when typing address manually
    useEffect(() => {
        if (!addressText || addressText.length < 5) return;
        
        // Prevent infinite loop if the address change came from the map's reverse geocode
        if (addressText === lastReverseGeocodedAddress.current) return;

        const fetchCoordinates = async () => {
            setIsFetchingAddress(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressText)}`
                );
                const data = await response.json();
                if (data && data.length > 0) {
                    const { lat, lon } = data[0];
                    setMapPosition({ lat: parseFloat(lat), lng: parseFloat(lon) });
                }
            } catch (error) {
                console.error("Error forward geocoding address:", error);
            } finally {
                setIsFetchingAddress(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchCoordinates();
        }, 1500); // 1.5s debounce for typing

        return () => clearTimeout(timeoutId);
    }, [addressText]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setImagePreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleRemove = () => {
        setFile(null);
        setImagePreview(null);
    };

    const [showAddressPrompt, setShowAddressPrompt] = useState(false);
    const [pendingFormData, setPendingFormData] = useState(null);

    // Securely initialize mapPosition if missing but user data exists
    useEffect(() => {
        if (!user) return;
        setMapPosition(prev => {
            if (prev) return prev;
            if (user.addresses?.[0]?.lat && user.addresses?.[0]?.lng) {
                return { lat: user.addresses[0].lat, lng: user.addresses[0].lng };
            }
            return null;
        });
    }, [user]);

    const isDifferentLocation = () => {
        if (!user) return false;
        const dbAddr = user?.addresses?.[0];
        if (!dbAddr) return true;
        
        // Normalize text to compare
        const dbAddrText = [dbAddr.street, dbAddr.city, dbAddr.country].filter(Boolean).join(", ").trim();
        const currentText = (addressText || "").trim();
        
        if (currentText !== dbAddrText) return true;
        
        // Check map position with tolerance for float precision
        if (mapPosition?.lat && dbAddr.lat) {
            const latDiff = Math.abs(mapPosition.lat - dbAddr.lat);
            const lngDiff = Math.abs(mapPosition.lng - dbAddr.lng);
            if (latDiff > 0.00001 || lngDiff > 0.00001) return true;
        } else if (mapPosition?.lat && !dbAddr.lat) {
            return true;
        }
        
        return false;
    };

    const processPrescription = async (formData, savePermanently) => {
        try {
            if (savePermanently && user) {
                const updatedUser = {
                    ...user,
                    addresses: [
                        {
                            ...(user.addresses?.[0] || {}),
                            street: addressText,
                            lat: mapPosition.lat,
                            lng: mapPosition.lng,
                        }
                    ]
                };
                const updateFormData = new FormData();
                updateFormData.append("data", JSON.stringify(updatedUser));
                const res = await updateUser({ userId: user._id, user: updateFormData });
                if (res?.user) {
                    dispatch(loginSuccess(res.user));
                }
            }

            const response = await uploadPrescription(formData);
            if (response.success) {
                toast.success("Prescription submitted successfully!");
                navigate("/");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit prescription.");
        } finally {
            setShowAddressPrompt(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!file) {
            toast.error("Please upload a prescription image.");
            return;
        }

        if (!name || !phone || !mapPosition) {
            toast.error("Name, Phone, and Delivery Location are required.");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);
        formData.append("notes", "Prescription order request");
        formData.append("name", name);
        formData.append("phone", phone);
        formData.append("address_text", addressText);
        formData.append("address_lat", mapPosition.lat);
        formData.append("address_lng", mapPosition.lng);

        if (user && isDifferentLocation()) {
            setPendingFormData(formData);
            setShowAddressPrompt(true);
        } else {
            processPrescription(formData, false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-[85vh] pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 pt-6 pb-10">
                <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">
                        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                        <ChevronRight size={14} />
                        <span className="text-primary-dark">Prescription</span>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-primary-pale rounded-2xl flex items-center justify-center">
                                    <FileText size={24} className="text-primary-dark" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Upload Prescription</h1>
                            </div>
                            <p className="text-gray-500 font-bold max-w-xl text-sm md:text-base ml-15">
                                Securely upload your doctor's prescription. Our certified pharmacists will review it and deliver your medicines directly to your door.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 lg:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Upload & Guidelines */}
                    <div className="lg:col-span-6 space-y-6">
                        
                        {/* The Uploader Box */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                1. Upload Document
                            </h2>
                            
                            {!imagePreview ? (
                                <div className="w-full relative border-2 border-dashed border-primary-light bg-primary-pale/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center group transition-colors hover:bg-primary-pale/60 min-h-[300px]">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={handleFileChange}
                                    />
                                    <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <UploadCloud size={32} />
                                    </div>
                                    <h3 className="text-lg font-black text-primary-dark mb-2">Tap to Upload Image</h3>
                                    <p className="text-sm font-bold text-gray-500 max-w-xs">
                                        Supported formats: JPG, PNG, WEBP.
                                    </p>
                                </div>
                            ) : (
                                <div className="w-full relative rounded-2xl overflow-hidden border-2 border-primary shadow-sm bg-gray-50 flex items-center justify-center min-h-[300px] p-2">
                                    <img src={imagePreview} alt="Prescription" className="max-h-[400px] w-auto object-contain rounded-xl" />
                                    
                                    <button 
                                        onClick={handleRemove}
                                        className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 transition-colors z-20 cursor-pointer"
                                        title="Remove Image"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Guidelines Box */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <AlertCircle size={18} className="text-amber-500" /> Image Guidelines
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <CheckCircle2 size={20} className="text-primary shrink-0" />
                                    <span className="text-xs font-bold text-gray-600">Ensure the doctor's name and clinic details are visible.</span>
                                </div>
                                <div className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <CheckCircle2 size={20} className="text-primary shrink-0" />
                                    <span className="text-xs font-bold text-gray-600">Patient name and date must be clearly readable.</span>
                                </div>
                                <div className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <CheckCircle2 size={20} className="text-primary shrink-0" />
                                    <span className="text-xs font-bold text-gray-600">The entire document should be in the frame.</span>
                                </div>
                                <div className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <CheckCircle2 size={20} className="text-primary shrink-0" />
                                    <span className="text-xs font-bold text-gray-600">Avoid blurry, dark, or heavily cropped photos.</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Details & Submission */}
                    <div className="lg:col-span-6">
                        <div className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-primary-pale/40 p-6 md:p-8 sticky top-28">
                            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                2. Delivery Details
                            </h2>
                            
                            <div className="space-y-5">
                                {/* Name Input */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        <User size={14} className="text-primary" /> Full Name
                                    </label>
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your full name"
                                        className="bg-gray-50 border-2 border-gray-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-primary focus:bg-white transition-all w-full"
                                    />
                                </div>

                                {/* Phone Input */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        <Phone size={14} className="text-primary" /> Phone Number
                                    </label>
                                    <input 
                                        type="tel" 
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="03XX-XXXXXXX"
                                        className="bg-gray-50 border-2 border-gray-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-primary focus:bg-white transition-all w-full"
                                    />
                                </div>

                                {/* Map Picker */}
                                <div className="flex flex-col gap-2 pt-2 pb-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <span>Pin Exact Location</span>
                                            {isFetchingAddress && <Loader size={12} className="animate-spin text-primary" />}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if ("geolocation" in navigator) {
                                                    navigator.geolocation.getCurrentPosition(
                                                        (pos) => setMapPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                                                        (err) => alert("Please allow location access to auto-detect your location.")
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
                                        <LocationPicker position={mapPosition} setPosition={setMapPosition} />
                                    </div>
                                </div>

                                {/* Address Input */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        <MapPin size={14} className="text-primary" /> Delivery Address
                                        {isFetchingAddress && <Loader size={12} className="animate-spin text-primary ml-auto" />}
                                    </label>
                                    <textarea 
                                        value={addressText}
                                        onChange={(e) => setAddressText(e.target.value)}
                                        placeholder="Building, Street, Area..."
                                        className="bg-gray-50 border-2 border-gray-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-primary focus:bg-white transition-all w-full resize-none h-24"
                                    />
                                    <p className="text-[10px] font-bold text-gray-400 mt-[-4px]">
                                        * Automatically filled when you drop the pin on the map.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 border-t-2 border-dashed border-gray-100 pt-6">
                                <button 
                                    onClick={handlePlaceOrder}
                                    disabled={loading || !imagePreview}
                                    className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-md flex justify-center items-center gap-2 cursor-pointer ${
                                        !imagePreview 
                                            ? "bg-gray-100 text-gray-400 shadow-none cursor-not-allowed" 
                                            : "bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5"
                                    }`}
                                >
                                    {loading ? (
                                        <><Loader size={18} className="animate-spin" /> Processing...</>
                                    ) : (
                                        "Submit Prescription"
                                    )}
                                </button>
                                {!imagePreview && (
                                    <p className="text-center text-xs font-bold text-amber-500 mt-3">
                                        * Please upload a prescription image to proceed.
                                    </p>
                                )}
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
                                onClick={() => processPrescription(pendingFormData, true)}
                                className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-primary-dark transition-all cursor-pointer"
                            >
                                Save Permanently & Submit
                            </button>
                            <button
                                onClick={() => processPrescription(pendingFormData, false)}
                                className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all cursor-pointer"
                            >
                                Just for this Request
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
        </div>
    );
};

export default UploadPrescription;
