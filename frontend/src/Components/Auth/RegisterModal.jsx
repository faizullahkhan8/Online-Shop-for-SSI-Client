import { useAddressLookup } from "../../hooks/useAddressLookup.js";
import { addressFields } from "../../utils/location.js";
import { FormField, FieldLabel, FieldControl } from "../../UI/FormField";
import { createPortal } from "react-dom";
import { useDialog } from "../../hooks/useDialog";
import { useState, useRef } from "react";
import { X, User, Phone, Mail, MapPin, Loader2, ChevronRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/slices/authSlice.js";
import { useRegisterUser, useVerifyPhone, useResendOTP, useUpdateUser } from "../../api/hooks/user.api";
import { toast } from "react-toastify";
import LocationPicker from "../LocationPicker.jsx";

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin, initialUserId }) => {
    const panelRef = useRef(null);
    useDialog(isOpen, onClose, panelRef);
    const dispatch = useDispatch();
    const { registerUser, loading: registering } = useRegisterUser();

    // Steps: 1 = Details, 2 = OTP, 3 = Address
    const [step, setStep] = useState(initialUserId ? 2 : 1);
    const [deliveryMessage, setDeliveryMessage] = useState("");

    // Form State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6 digits for OTP
    const [userId, setUserId] = useState(initialUserId || null);
    
    // Address State
    const [addressText, setAddressText] = useState("");
    const [mapPosition, setMapPosition] = useState(null);
    const [registrationAddress, setRegistrationAddress] = useState({});
    const { updateUser, loading: savingAddress } = useUpdateUser();
    const isFetchingAddress = useAddressLookup({ position: mapPosition, text: addressText, onPosition: setMapPosition,
        onAddress: data => { setAddressText(data.display_name); setRegistrationAddress(addressFields(data)); } });

    const { verifyPhone, loading: verifying } = useVerifyPhone();
    const { resendOTP, loading: resending } = useResendOTP();
    const loading = registering || verifying || resending || savingAddress;

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!name || !phone || !password || !confirmPassword) {
            toast.error("All fields are required.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
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
            setDeliveryMessage(response.message);
            setStep(2);
        }
    };

    const handleResendOTP = async () => {
        if (!userId) return;
        const response = await resendOTP({ userId });
        setDeliveryMessage(response?.smsSent ? "A new code was sent to your phone." : "The SMS could not be sent. Please try again later.");
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
        if (!addressText.trim()) { toast.error("Please enter your address."); return; }
        const data = new FormData();
        data.append("data", JSON.stringify({ addresses: [{ ...registrationAddress, street: addressText, ...(mapPosition || {}) }] }));
        const result = await updateUser({ userId, user: data });
        if (result?.success) { dispatch(loginSuccess(result.user)); onClose(); }
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

    return createPortal(
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 sm:p-6">
            <div data-dialog-backdrop="" aria-hidden="true" className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Create account" tabIndex={-1} className="max-h-[90dvh] overflow-y-auto relative bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
                {/* Close Button */}
                <button 
                    aria-label="Close create account"
                    onClick={onClose}
                    className="absolute top-4 right-4 w-11 h-11 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full flex items-center justify-center transition-colors z-10 cursor-pointer"
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
                            {step === 1 ? "Join us and start shopping for healthcare essentials." : step === 2 ? (deliveryMessage || "Enter a verification code, or request a new code below.") : "Set your default delivery location."}
                        </p>
                    </div>

                    {/* Step 1: Details */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div className="space-y-1.5">
                                <label htmlFor="registermodal-field-1" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name *</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input id="registermodal-field-1"
                                        type="text"
                                        required
                                        placeholder="Enter your name"
                                        className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="registermodal-field-2" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input id="registermodal-field-2"
                                        type="tel"
                                        required
                                        placeholder="03XX-XXXXXXX"
                                        className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="registermodal-field-3" className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                                    Email Address <span className="text-gray-400 font-medium lowercase">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input id="registermodal-field-3"
                                        type="email"
                                        placeholder="name@example.com"
                                        className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="registermodal-field-4" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password *</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input id="registermodal-field-4"
                                        type="password"
                                        required
                                        placeholder="Create a password"
                                        className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="registermodal-field-5" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm Password *</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input id="registermodal-field-5"
                                        type="password"
                                        required
                                        placeholder="Confirm your password"
                                        className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !name || !phone || !password || !confirmPassword}
                                className="w-full h-12 mt-6 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} /> Saving details...
                                    </>
                                ) : (
                                    <>
                                        Continue <ChevronRight size={18} />
                                    </>
                                )}
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
                                        aria-label={`Verification digit ${idx + 1}`}
                                        id={`otp-${idx}`}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                        disabled={loading}
                                        className="w-14 h-14 bg-gray-50 border-2 border-gray-100 rounded-xl text-center text-xl font-black text-gray-900 focus:outline-none focus:border-primary focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                ))}
                            </div>
                            
                            <div className="text-center">
                                <button type="button" onClick={handleResendOTP} disabled={loading} className="text-xs font-bold text-primary hover:text-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    Resend Code
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.join("").length < 6}
                                className="w-full h-12 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} /> Verifying code...
                                    </>
                                ) : (
                                    "Verify OTP"
                                )}
                            </button>
                            
                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={onSwitchToLogin}
                                    className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    Return to login
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Address */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="registermodal-field-6" className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                                    <span>Pin Exact Location</span>
                                </label>
                                <div className="rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm h-[180px] relative z-0">
                                    <LocationPicker position={mapPosition} setPosition={setMapPosition} />
                                </div>
                            </div>

                            <FormField id="registermodal-field-6" className="flex flex-col gap-2">
                                <FieldLabel className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <MapPin size={14} className="text-primary" /> Delivery Address
                                    {isFetchingAddress && <Loader2 size={12} className="animate-spin text-primary ml-auto" />}
                                </FieldLabel>
                                <FieldControl as="textarea" id="registermodal-field-6"
                                    value={addressText}
                                    onChange={(e) => setAddressText(e.target.value)}
                                    placeholder="Building, Street, Area..."
                                    className="bg-gray-50 border-2 border-gray-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-primary focus:bg-white transition-all w-full resize-none h-20"
                                />
                            </FormField>

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
    , document.body);
};

export default RegisterModal;
