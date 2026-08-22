import { useState, useEffect } from "react";
import { X, Phone, MapPin, Loader2, ChevronRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/slices/authSlice.js";
import { useLoginUser } from "../../api/hooks/user.api";
import { toast } from "react-toastify";
import LocationPicker from "../LocationPicker.jsx";
import { useNavigate } from "react-router-dom";

const LoginModal = ({ isOpen, onClose, onSwitchToRegister }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loginUser } = useLoginUser();

    // Steps: 1 = Phone, 2 = OTP, 3 = Address Review
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState(["", "", "", ""]);
    
    // Address State
    const [addressText, setAddressText] = useState("");
    const [mapPosition, setMapPosition] = useState(null);
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setPhone("");
            setOtp(["", "", "", ""]);
            setAddressText("");
            setMapPosition(null); // Assuming user's previous location could be set here if we had an endpoint for it
        }
    }, [isOpen]);

    // Reverse Geocoding for Address Step
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

        const timeoutId = setTimeout(() => {
            fetchAddress();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [mapPosition]);

    const handleSendOTP = (e) => {
        e.preventDefault();
        if (!phone) {
            toast.error("Phone Number is required.");
            return;
        }
        setLoading(true);
        // Simulate API call to send OTP
        setTimeout(() => {
            setLoading(false);
            toast.success(`OTP sent to ${phone}`);
            setStep(2);
        }, 1000);
    };

    const handleVerifyOTP = (e) => {
        e.preventDefault();
        const otpCode = otp.join("");
        if (otpCode.length < 4) {
            toast.error("Please enter the complete 4-digit OTP.");
            return;
        }
        setLoading(true);
        // Simulate OTP verification
        setTimeout(() => {
            setLoading(false);
            toast.success("Phone verified successfully!");
            // Set some default map position to simulate "reviewing existing address"
            setMapPosition({ lat: 24.8607, lng: 67.0011 }); // Default to Karachi coordinates
            setStep(3); // Move to address review step
        }, 1000);
    };

    const handleCompleteLogin = async () => {
        setLoading(true);
        try {
            // Since the backend doesn't support phone/OTP login yet, 
            // we will simulate a successful login for the UI flow.
            
            // Try to log in with a fake email to trigger the API (it will likely fail due to invalid creds)
            // But we will handle it gracefully and log them in locally for demonstration.
            const dummyEmail = `${phone.replace(/\D/g, "")}@user.medicare.com`;
            
            try {
                // We'll wrap this in a try-catch so we can fallback to local login
                const response = await loginUser({
                    email: dummyEmail,
                    password: "dummyPassword123"
                });
                
                if (response?.success) {
                    dispatch(loginSuccess(response.user));
                    onClose();
                    return;
                }
            } catch(e) {
                console.log("Backend login failed (expected with mock OTP flow). Falling back to mock session.");
            }

            // Fallback: Dispatch a mock user to Redux so the UI works
            dispatch(loginSuccess({
                _id: "mock_" + Date.now(),
                name: "Verified User",
                phone: phone,
                email: dummyEmail,
                role: "user",
                avatar: ""
            }));
            
            toast.success("Logged in successfully");
            onClose();
            
        } catch (error) {
            toast.error("Login failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value !== "" && index < 3) {
            const nextInput = document.getElementById(`login-otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            const prevInput = document.getElementById(`login-otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full flex items-center justify-center transition-colors z-10 cursor-pointer"
                >
                    <X size={18} />
                </button>

                {/* Content */}
                <div className="p-6 md:p-8">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-14 h-14 bg-primary-pale rounded-2xl flex items-center justify-center mb-4">
                            <ShieldCheck className="text-primary" size={28} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                            {step === 1 ? "Welcome Back" : step === 2 ? "Verify Phone" : "Review Address"}
                        </h2>
                        <p className="text-gray-500 text-sm font-bold mt-2">
                            {step === 1 ? "Log in to access your orders and prescriptions." : step === 2 ? `We sent a code to ${phone}` : "Review or update your default delivery location."}
                        </p>
                    </div>

                    {/* Step 1: Phone */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        required
                                        placeholder="03XX-XXXXXXX"
                                        className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !phone}
                                className="w-full h-12 mt-6 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : "Send Code"} 
                                {!loading && <ChevronRight size={18} />}
                            </button>
                            
                            <div className="mt-6 text-center border-t border-gray-100 pt-6">
                                <p className="text-sm font-bold text-gray-500">
                                    Don't have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={onSwitchToRegister}
                                        className="text-primary hover:text-primary-dark transition-colors cursor-pointer"
                                    >
                                        Sign up
                                    </button>
                                </p>
                            </div>
                        </form>
                    )}

                    {/* Step 2: OTP */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div className="flex justify-center gap-3">
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        id={`login-otp-${idx}`}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                        className="w-14 h-14 bg-gray-50 border-2 border-gray-100 rounded-xl text-center text-xl font-black text-gray-900 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                    />
                                ))}
                            </div>
                            
                            <div className="text-center">
                                <button type="button" className="text-xs font-bold text-primary hover:text-primary-dark transition-colors">
                                    Resend Code
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.join("").length < 4}
                                className="w-full h-12 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : "Verify OTP"}
                            </button>
                            
                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    Wrong phone number? Go back
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Address Review */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                                    <span>Pin Exact Location</span>
                                </label>
                                <div className="rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm h-[180px] relative z-0">
                                    <LocationPicker position={mapPosition} setPosition={setMapPosition} />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <MapPin size={14} className="text-primary" /> Delivery Address
                                    {isFetchingAddress && <Loader2 size={12} className="animate-spin text-primary ml-auto" />}
                                </label>
                                <textarea 
                                    value={addressText}
                                    onChange={(e) => setAddressText(e.target.value)}
                                    placeholder="Building, Street, Area..."
                                    className="bg-gray-50 border-2 border-gray-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-primary focus:bg-white transition-all w-full resize-none h-20"
                                />
                            </div>

                            <button
                                onClick={handleCompleteLogin}
                                disabled={loading || !mapPosition}
                                className="w-full h-12 mt-4 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                    <><CheckCircle2 size={18} /> Confirm Login</>
                                )}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default LoginModal;
