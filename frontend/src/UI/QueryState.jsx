import { AlertCircle, RefreshCw } from "lucide-react";

export function QueryError({ message = "Could not load this page.", onRetry = () => window.location.reload() }) {
    return <div role="alert" className="my-6 rounded-2xl border border-red-200 bg-white p-6 sm:p-8 max-w-2xl mx-auto">
        <AlertCircle aria-hidden="true" size={28} className="text-red-600 mb-3" />
        <h2 className="text-lg text-gray-900 mb-2">Something needs another try</h2>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"><RefreshCw size={16} aria-hidden="true" />Try again</button>
    </div>;
}
export function QueryLoading({ label = "Loading…" }) {
    return <div role="status" aria-live="polite" className="my-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <div aria-hidden="true" className="space-y-3 animate-pulse"><div className="h-5 w-2/3 rounded bg-gray-200" /><div className="h-4 w-full rounded bg-gray-100" /><div className="h-4 w-5/6 rounded bg-gray-100" /></div>
    </div>;
}
