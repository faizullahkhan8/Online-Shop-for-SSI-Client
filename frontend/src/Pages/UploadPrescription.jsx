import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUploadPrescription } from "../api/hooks/prescription.api.js";
import { toast } from "react-toastify";
import {
    ChevronRight,
    UploadCloud,
    Bell,
    DoorClosed,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Image as ImageIcon,
    Loader,
    MapPin,
    User,
    Phone
} from "lucide-react";
import { useSelector } from "react-redux";
import LocationPicker from "../Components/LocationPicker.jsx";

const UploadPrescription = () => {
    const [imagePreview, setImagePreview] = useState(null);
    const [file, setFile] = useState(null);
    const [isGuideOpen, setIsGuideOpen] = useState(true);
    
    const { uploadPrescription, loading } = useUploadPrescription();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState("");
    const [addressText, setAddressText] = useState("");
    const [mapPosition, setMapPosition] = useState(null);
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);

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
                    setAddressText(data.display_name);
                }
            } catch (error) {
                console.error("Error fetching address:", error);
            } finally {
                setIsFetchingAddress(false);
            }
        };

        // Add a small debounce to prevent too many requests if user clicks rapidly
        const timeoutId = setTimeout(() => {
            fetchAddress();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [mapPosition]);

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

    const handlePlaceOrder = async () => {
        if (!file) {
            toast.error("Please select an image first.");
            return;
        }

        if (!name || !phone || !mapPosition) {
            toast.error("Name, Phone, and Map Location are required.");
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

        try {
            const response = await uploadPrescription(formData);
            if (response.success) {
                toast.success("Prescription uploaded successfully!");
                navigate("/"); // Or to a success page
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to upload prescription");
        }
    };

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Breadcrumbs */}
            <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
                <div className="flex items-center gap-2 text-sm">
                    <Link to="/" className="text-[#a16781] hover:underline font-medium">Home</Link>
                    <ChevronRight size={14} className="text-[#74AA34]" />
                    <span className="text-[#74AA34] font-medium">Prescription</span>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-20">
                    
                    {/* Left Side */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-1.5 h-8 bg-[#74AA34]"></div>
                            <h1 className="text-2xl md:text-3xl font-bold text-[#74AA34]">Upload Prescription</h1>
                        </div>
                        
                        <p className="text-gray-800 font-medium mb-10 text-sm md:text-base">
                            Upload prescription & get your medications delivered
                        </p>

                        <div className="flex items-start gap-8 md:gap-12 mb-12">
                            <div className="flex flex-col items-center text-center gap-2 max-w-[80px]">
                                <div className="w-14 h-14 rounded-full bg-[#74AA34] text-white flex items-center justify-center relative">
                                    <UploadCloud size={28} />
                                    <div className="absolute top-0 right-0 w-4 h-4 bg-[#A6D76E] rounded-full"></div>
                                </div>
                                <span className="text-xs font-semibold text-gray-700 leading-tight">Upload Prescription</span>
                            </div>

                            <div className="flex flex-col items-center text-center gap-2 max-w-[80px]">
                                <div className="w-14 h-14 rounded-full text-[#74AA34] flex items-center justify-center relative">
                                    <Bell size={40} className="fill-[#74AA34] stroke-[#74AA34]" />
                                    <div className="absolute top-0 right-0 w-4 h-4 bg-[#74AA34] rounded-full border-2 border-white"></div>
                                </div>
                                <span className="text-xs font-semibold text-gray-700 leading-tight">Received Notification</span>
                            </div>

                            <div className="flex flex-col items-center text-center gap-2 max-w-[80px]">
                                <div className="w-14 h-14 rounded-full bg-[#74AA34] text-white flex items-center justify-center relative">
                                    <DoorClosed size={28} />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 leading-tight">Doorstep Delivery</span>
                            </div>
                        </div>

                        {/* Accordion */}
                        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm max-w-sm">
                            <button 
                                onClick={() => setIsGuideOpen(!isGuideOpen)}
                                className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-bold text-gray-900 text-sm">Prescription Guide</span>
                                {isGuideOpen ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                            </button>
                            
                            {isGuideOpen && (
                                <div className="px-5 pb-5 bg-white space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <CheckCircle2 size={16} className="text-[#74AA34]" />
                                        Upload clear image
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <CheckCircle2 size={16} className="text-[#74AA34]" />
                                        Doctor details required
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <CheckCircle2 size={16} className="text-[#74AA34]" />
                                        Date of prescription
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <CheckCircle2 size={16} className="text-[#74AA34]" />
                                        Patient details
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <CheckCircle2 size={16} className="text-[#74AA34]" />
                                        Dosage details
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col items-center">
                        <div className="w-full max-w-md bg-white border border-gray-100 rounded-xl shadow-sm p-2 flex flex-col items-center justify-center min-h-[400px]">
                            
                            {!imagePreview ? (
                                <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center relative cursor-pointer group">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={handleFileChange}
                                    />
                                    <div className="w-16 h-16 bg-[#74AA34] rounded-xl flex items-center justify-center text-white mb-4 group-hover:bg-[#629329] transition-colors">
                                        <ImageIcon size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-6">Gallery</h3>
                                    <p className="text-xs text-center text-gray-600 max-w-[280px] px-4 font-medium">
                                        <span className="font-bold text-black">Note:</span> Always upload a clear version of your Prescription for getting better results
                                    </p>
                                </div>
                            ) : (
                                <div className="w-full relative">
                                    <img src={imagePreview} alt="Prescription" className="w-full h-auto object-cover rounded-lg" />
                                </div>
                            )}

                        </div>

                        {/* Guest/Delivery Details Form */}
                        <div className="w-full max-w-md mt-6 bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex flex-col gap-4">
                            <h3 className="font-bold text-gray-900 text-lg">Delivery Details</h3>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><User size={16} /> Full Name</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#74AA34] focus:ring-1 focus:ring-[#74AA34] transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Phone size={16} /> Phone Number</label>
                                <input 
                                    type="text" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter your phone number"
                                    className="border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#74AA34] focus:ring-1 focus:ring-[#74AA34] transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <MapPin size={16} /> Delivery Address
                                    {isFetchingAddress && <Loader size={12} className="animate-spin text-gray-400" />}
                                </label>
                                <textarea 
                                    value={addressText}
                                    onChange={(e) => setAddressText(e.target.value)}
                                    placeholder="Enter complete address (Optional)"
                                    className="border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#74AA34] focus:ring-1 focus:ring-[#74AA34] transition-all resize-none h-20"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5 mt-2">
                                <label className="text-sm font-semibold text-gray-700">Pin Location on Map</label>
                                <p className="text-xs text-gray-500 mb-1">Click on the map to set your exact delivery location.</p>
                                <LocationPicker position={mapPosition} setPosition={setMapPosition} />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {imagePreview && (
                            <div className="mt-8 flex flex-col items-center w-full max-w-md gap-4">
                                <div className="flex gap-4 w-full px-8">
                                    <div className="relative flex-1">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={handleFileChange}
                                        />
                                        <button className="w-full py-2.5 bg-[#74AA34] text-white text-xs font-bold rounded-md hover:bg-[#629329] transition-colors uppercase tracking-wide cursor-pointer">
                                            Change
                                        </button>
                                    </div>
                                    <button 
                                        onClick={handleRemove}
                                        className="flex-1 py-2.5 bg-[#74AA34] text-white text-xs font-bold rounded-md hover:bg-[#629329] transition-colors uppercase tracking-wide cursor-pointer"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <button 
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                    className="w-[80%] max-w-[280px] mt-2 py-3.5 bg-[#74AA34] text-white text-sm font-bold rounded-md hover:bg-[#629329] transition-colors uppercase tracking-wider flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader size={18} className="animate-spin" /> : "Place Order"}
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default UploadPrescription;
