import { FormField, FieldLabel, FieldControl } from "../UI/FormField";
import { createPortal } from "react-dom";
import { useDialog } from "../hooks/useDialog";
import { X, AlertTriangle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Button from "../UI/Button";

const CancellationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Cancel order",
    description = "Are you sure you want to cancel this order? This action cannot be undone.",
    loading = false,
}) => {
    const panelRef = useRef(null);
    useDialog(isOpen, () => { if (!loading) onClose(); }, panelRef);
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setReason("");
            setError("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!reason.trim()) {
            setError("Please provide a cancellation reason.");
            return;
        }
        onConfirm(reason);
    };

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40">
            <div
                ref={panelRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
                className="max-h-[90dvh] overflow-y-auto w-full max-w-md bg-white rounded-lg border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={20} className="text-red-600" />
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {description}
                            </p>
                        </div>
                    </div>

                    <button
                        aria-label="Close cancellation dialog"
                        onClick={onClose}
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-3">
                    <FormField className="space-y-1.5">
                        <FieldLabel className="text-sm font-medium text-gray-700">
                            Cancellation reason
                        </FieldLabel>
                        <FieldControl as="textarea"
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                setError("");
                            }}
                            placeholder="Briefly explain why you want to cancel"
                            className="w-full h-24 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                        />
                        {error && (
                            <p className="text-xs text-red-600">{error}</p>
                        )}
                    </FormField>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="border-gray-300 text-gray-700"
                    >
                        Keep order
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        isLoading={loading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {loading ? "Cancelling…" : "Confirm cancellation"}
                    </Button>
                </div>
            </div>
        </div>
    , document.body);
};

export default CancellationModal;
