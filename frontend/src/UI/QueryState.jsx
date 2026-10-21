import { PageLoading } from "../Components/UI/PageLoading";
import { AlertCircle, RefreshCw } from "lucide-react";

export function QueryError({ message = "Could not load this page.", onRetry = () => window.location.reload() }) {
    return <div role="alert" className="my-6 rounded-2xl border border-red-200 bg-white p-6 sm:p-8 max-w-2xl mx-auto">
        <AlertCircle aria-hidden="true" size={28} className="text-red-600 mb-3" />
        <h2 className="text-lg text-gray-900 mb-2">Something needs another try</h2>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"><RefreshCw size={16} aria-hidden="true" />Try again</button>
    </div>;
}
export function QueryLoading({ label = "Loading…", variant = "form" }) {
    return <PageLoading variant={variant} label={label} />;
}
