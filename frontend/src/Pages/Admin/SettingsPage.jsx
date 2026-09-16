import { useEffect, useState } from "react";
import { Save, Loader2, MessageSquare, Settings as SettingsIcon } from "lucide-react";
import Input from "../../UI/Input.jsx";
import { useGetSettings, useUpdateSettings } from "../../api/hooks/settings.api";

const SettingsPage = () => {
    const { data: settingsData, isLoading: settingsLoading } = useGetSettings();
    const { updateSettings, loading: updateLoading } = useUpdateSettings();

    const [activeTab, setActiveTab] = useState("sms");

    const [form, setForm] = useState({
        smsGatewayUsername: "",
        smsGatewayPassword: "",
    });

    useEffect(() => {
        if (settingsData?.settings) {
            setForm({
                smsGatewayUsername: settingsData.settings.smsGatewayUsername || "",
                smsGatewayPassword: settingsData.settings.smsGatewayPassword || "",
            });
        }
    }, [settingsData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await updateSettings({
            smsGatewayUsername: form.smsGatewayUsername,
            smsGatewayPassword: form.smsGatewayPassword,
        });
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center gap-3 pb-6 border-b border-gray-200">
                <div className="p-2.5 bg-primary rounded-lg text-white shadow-sm">
                    <SettingsIcon size={20} />
                </div>
                <div>
                    <h2 className="text-3xl font-display text-gray-900">
                        System Settings
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Manage global configuration for your application
                    </p>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 shrink-0 flex md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    <button
                        onClick={() => setActiveTab("sms")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
                            activeTab === "sms"
                                ? "bg-primary text-white shadow-sm"
                                : "bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                        }`}
                    >
                        <MessageSquare size={18} />
                        SMS Gateway
                    </button>
                    {/* Future tabs can go here */}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-3xl p-6 md:p-8 border-2 border-transparent hover:border-primary-light shadow-sm hover:shadow-xl hover:shadow-primary-pale/40 transition-all duration-300">
                    {activeTab === "sms" && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                    <MessageSquare size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">SMS Gateway Credentials</h2>
                                    <p className="text-sm text-gray-500 font-medium">Update username and password for sms-gate.app (Encrypted in database)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">SMS Gateway Username</label>
                                    <Input
                                        type="text"
                                        value={form.smsGatewayUsername}
                                        onChange={(e) => setForm({ ...form, smsGatewayUsername: e.target.value })}
                                        placeholder="Enter Username"
                                        className="w-full text-sm font-bold bg-gray-50"
                                        disabled={settingsLoading}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">SMS Gateway Password</label>
                                    <Input
                                        type="text"
                                        value={form.smsGatewayPassword}
                                        onChange={(e) => setForm({ ...form, smsGatewayPassword: e.target.value })}
                                        placeholder="Enter Password"
                                        className="w-full text-sm font-bold bg-gray-50"
                                        disabled={settingsLoading}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Leave as is if you do not want to change it. This field displays the decrypted password.</p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={updateLoading || settingsLoading}
                                    className="w-full md:w-auto px-8 bg-primary text-white rounded-lg py-3 font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updateLoading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
