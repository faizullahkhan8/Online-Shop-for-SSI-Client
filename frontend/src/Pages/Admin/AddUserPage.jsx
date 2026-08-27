import { useEffect, useState } from "react";
import { useAddUserFromAdmin, useGetAllUsers } from "../../api/hooks/user.api";
import {
    ShieldCheck,
    User,
    Mail,
    Lock,
    UserPlus,
    RefreshCw,
    Fingerprint,
    Phone,
} from "lucide-react";

const AddUserPage = () => {
    const { addUserFromAdmin, loading } = useAddUserFromAdmin();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "user",
        phone: "",
    });

    const submit = async (e) => {
        e.preventDefault();
        const res = await addUserFromAdmin(form);
        if (res?.user) {
            setForm({ name: "", email: "", password: "", role: "user", phone: "" });
        }
    };

    return (
        <div className="space-y-6">
            <header className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <UserPlus className="text-primary" size={24} />
                    Add User
                </h2>
                <p className="text-sm text-gray-600 mt-1">Create a new user account</p>
            </header>

            <form
                onSubmit={submit}
                className="bg-white rounded-3xl p-6 border-2 border-transparent hover:border-primary-light shadow-sm hover:shadow-xl hover:shadow-primary-pale/40 transition-all duration-300 space-y-5"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Full Name
                        </label>
                        <div className="relative">
                            <User
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={16}
                            />
                            <input
                                required
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                placeholder="John Doe"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={16}
                            />
                            <input
                                required
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                placeholder="user@example.com"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={16}
                            />
                            <input
                                required
                                type="tel"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                                placeholder="+1 234 567 8900"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="relative">
                            <Lock
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={16}
                            />
                            <input
                                required
                                type="password"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        password: e.target.value,
                                    })
                                }
                                placeholder="••••••••"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Role
                        </label>
                        <div className="relative">
                            <ShieldCheck
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={16}
                            />
                            <select
                                value={form.role}
                                onChange={(e) =>
                                    setForm({ ...form, role: e.target.value })
                                }
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        disabled={loading}
                        className="w-full bg-primary text-white rounded-lg py-2.5 font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <UserPlus size={16} />
                                Add User
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddUserPage;