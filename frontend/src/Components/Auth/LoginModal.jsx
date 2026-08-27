import { useState, useEffect } from "react";
import { X, User, Phone, Loader2, ChevronRight, ShieldCheck, Mail } from "lucide-react";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/slices/authSlice.js";
import { useLoginUser } from "../../api/hooks/user.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const LoginModal = ({ isOpen, onClose, onSwitchToRegister }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loginUser } = useLoginUser();

    const [loading, setLoading] = useState(false);

    // Form State
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setIdentifier("");
            setPassword("");
        }
    }, [isOpen]);

    const handleCompleteLogin = async (e) => {
        e.preventDefault();
        if (!identifier || !password) {
            toast.error("Please enter both email/phone and password.");
            return;
        }
        
        setLoading(true);
        try {
            // We pass both as identifier, backend checks if it's email or phone
            const isEmail = identifier.includes("@");
            const payload = {
                password,
            };
            if (isEmail) {
                payload.email = identifier;
            } else {
                payload.phone = identifier;
            }

            const response = await loginUser(payload);
            
            if (response?.success) {
                dispatch(loginSuccess(response.user));
                onClose();
            }
        } catch (error) {
            toast.error("Login failed.");
        } finally {
            setLoading(false);
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
                            Welcome Back
                        </h2>
                        <p className="text-gray-500 text-sm font-bold mt-2">
                            Log in to access your orders and prescriptions.
                        </p>
                    </div>

                    <form onSubmit={handleCompleteLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email or Phone *</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter email or phone number"
                                    className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
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
                                    placeholder="Enter your password"
                                    className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !identifier || !password}
                            className="w-full h-12 mt-6 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : "Log In"} 
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
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
