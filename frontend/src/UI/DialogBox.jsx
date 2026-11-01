import { createPortal } from "react-dom";
import { useRef } from "react";
import { useDialog } from "../hooks/useDialog";
import { AlertTriangle, RotateCcw, X, Loader2 } from "lucide-react";

const DeleteDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Item",
    message = "Are you sure you want to delete this? This action cannot be undone.",
    loading = false,
    confirmLabel = "Delete Item",
    tone = "danger",
}) => {
    const panelRef = useRef(null);
    useDialog(isOpen, () => { if (!loading) onClose(); }, panelRef);
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                data-dialog-backdrop="" aria-hidden="true" className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={loading ? null : onClose}
            />

            {/* Dialog Content */}
            <div ref={panelRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-in fade-in zoom-in duration-100">
                <div className="p-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${tone === "positive" ? "bg-primary-pale text-primary-dark" : "bg-red-100 text-red-600"}`}>
                            {tone === "positive" ? <RotateCcw size={24} aria-hidden="true" /> : <AlertTriangle size={24} aria-hidden="true" />}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">
                                {title}
                            </h3>
                            <button
                                type="button" disabled={loading} aria-label="Close confirmation dialog"
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`min-h-11 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors flex items-center justify-center min-w-[100px] disabled:opacity-50 ${tone === "positive" ? "bg-primary hover:bg-primary-dark" : "bg-red-600 hover:bg-red-700"}`}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </div>
    , document.body);
};

export default DeleteDialog;
