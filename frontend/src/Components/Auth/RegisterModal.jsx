import { useState, useEffect } from "react";
import { X, User, Phone, Mail, MapPin, Loader2, ChevronRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/slices/authSlice.js";
import { useRegisterUser, useVerifyPhone } from "../../api/hooks/user.api";
import { toast } from "react-toastify";
import LocationPicker from "../LocationPicker.jsx";
import { useNavigate } from "react-router-dom";

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { registerUser } = useRegisterUser();

    // Steps: 1 = Details, 2 = OTP, 3 = Address
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6 digits for OTP
    const [userId, setUserId] = useState(null);
    
    // Address State
    const [addressText, setAddressText] = useState("");
    const [mapPosition, setMapPosition] = useState(null);
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setName("");
            setPhone("");
            setEmail("");
            setPassword("");
            setOtp(["", "", "", "", "", ""]);
            setUserId(null);
            setAddressText("");
            setMapPosition(null);
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

    const { verifyPhone } = useVerifyPhone();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!name || !phone || !password) {
            toast.error("Name, Phone, and Password are required.");
            return;
        }
        
        const finalEmail = email || `${phone.replace(/\D/g, "")}@user.medicare.com`;

        const response = await registerUser({
            name,
            email: finalEmail,
            password,
            phone,
        });

        if (response?.success && response.userId) {
            setUserId(response.userId);
            setStep(2);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const otpCode = otp.join("");
        if (otpCode.length < 6) {
            toast.error("Please enter the complete 6-digit OTP.");
            return;
        }

        const response = await verifyPhone({ userId, otp: otpCode });
        
        if (response?.success) {
            dispatch(loginSuccess(response.user));
            setStep(3); // Move to address step
        }
    };

    const handleCompleteRegistration = async () => {
        // Here we could hit a profile update API if we want to save the address immediately
        onClose();
    };

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value !== "" && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
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
                            {step === 1 ? "Create Account" : step === 2 ? "Verify Phone" : "Delivery Address"}
                        </h2>
                        <p className="text-gray-500 text-sm font-bold mt-2">
                            {step === 1 ? "Join us and start shopping for healthcare essentials." : step === 2 ? `We sent a code to ${phone}` : "Set your default delivery location."}
                        </p>
                    </div>

                    {/* Step 1: Details */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name *</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter your name"
                                        className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>

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

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                                    Email Address <span className="text-gray-400 font-medium lowercase">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password *</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        placeholder="Create a password"
                                        className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !name || !phone || !password}
                                className="w-full h-12 mt-6 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : "Continue"} 
                                {!loading && <ChevronRight size={18} />}
                            </button>
                            
                            <div className="mt-6 text-center border-t border-gray-100 pt-6">
                                <p className="text-sm font-bold text-gray-500">
                                    Already have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={onSwitchToLogin}
                                        className="text-primary hover:text-primary-dark transition-colors cursor-pointer"
                                    >
                                        Log in
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
                                        id={`otp-${idx}`}
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
                                disabled={loading || otp.join("").length < 6}
                                className="w-full h-12 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : "Verify OTP"}
                            </button>
                            
                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    Wrong phone number? Go back
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Address */}
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
                                onClick={handleCompleteRegistration}
                                disabled={loading || !mapPosition}
                                className="w-full h-12 mt-4 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                    <><CheckCircle2 size={18} /> Complete Setup</>
                                )}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default RegisterModal;
