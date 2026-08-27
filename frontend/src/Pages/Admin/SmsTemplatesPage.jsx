import { useEffect, useState } from "react";
import { useSmsTemplates } from "../../api/hooks/smsTemplate.api";
import { Loader2, Save, Power, CheckCircle, RefreshCw, MessageSquare } from "lucide-react";
import AdminLayout from "../../Layout/AdminLayout";
import { toast } from "react-toastify";

const SmsTemplatesPage = () => {
    const { loading, templates, fetchTemplates, updateTemplate, seedTemplates } = useSmsTemplates();
    const [editingTemplate, setEditingTemplate] = useState(null);

    useEffect(() => {
        fetchTemplates();
        // eslint-disable-next-line
    }, []);

    const handleSave = async (id, isActive, messageTemplate) => {
        await updateTemplate(id, { isActive, messageTemplate });
        setEditingTemplate(null);
    };

    const handleSeed = async () => {
        if (window.confirm("This will seed default templates for any missing ones. Are you sure?")) {
            await seedTemplates();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <MessageSquare className="text-primary" />
                        SMS Templates
                    </h2>
                    <p className="text-gray-500 mt-1">Manage automated SMS notifications</p>
                </div>
                <button
                    onClick={handleSeed}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 cursor-pointer"
                >
                    <RefreshCw size={18} />
                    Seed Defaults
                </button>
            </div>

            {loading && !templates.length ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {templates.map((template) => (
                        <div key={template._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-gray-900 text-lg">{template.eventName}</h3>
                                <button
                                    onClick={() => handleSave(template._id, !template.isActive, template.messageTemplate)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                                        template.isActive 
                                            ? "bg-green-50 text-green-700 hover:bg-green-100" 
                                            : "bg-red-50 text-red-700 hover:bg-red-100"
                                    }`}
                                >
                                    <Power size={14} />
                                    {template.isActive ? "Enabled" : "Disabled"}
                                </button>
                            </div>

                            {editingTemplate === template._id ? (
                                <div className="flex-1 flex flex-col gap-3">
                                    <textarea
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-700 text-sm focus:outline-none focus:border-primary resize-none"
                                        rows={4}
                                        defaultValue={template.messageTemplate}
                                        id={`textarea-${template._id}`}
                                    />
                                    <div className="flex justify-end gap-2 mt-auto">
                                        <button
                                            onClick={() => setEditingTemplate(null)}
                                            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                const val = document.getElementById(`textarea-${template._id}`).value;
                                                handleSave(template._id, template.isActive, val);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors cursor-pointer"
                                        >
                                            <Save size={16} /> Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{template.messageTemplate}</p>
                                    </div>
                                    <button
                                        onClick={() => setEditingTemplate(template._id)}
                                        className="self-end text-primary text-sm font-bold hover:text-primary-dark transition-colors cursor-pointer"
                                    >
                                        Edit Message
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {templates.length === 0 && !loading && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                            <MessageSquare size={48} className="mb-4 opacity-50" />
                            <p>No SMS templates found.</p>
                            <button
                                onClick={handleSeed}
                                className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors cursor-pointer"
                            >
                                Seed Defaults Now
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SmsTemplatesPage;
