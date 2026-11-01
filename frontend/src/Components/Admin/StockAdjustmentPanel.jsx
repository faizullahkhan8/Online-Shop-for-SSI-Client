import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import apiClient from "../../api/apiClient";

const control = "mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark disabled:bg-gray-50 disabled:text-gray-500";

export default function StockAdjustmentPanel({ product, onAdjusted, onReload, onLockChange = () => {} }) {
    const queryClient = useQueryClient();
    const [delta, setDelta] = useState("");
    const [reason, setReason] = useState("");
    const [variantId, setVariantId] = useState("");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [needsReload, setNeedsReload] = useState(false);
    const [uncertain, setUncertain] = useState(false);
    const [unconfirmedBalance, setUnconfirmedBalance] = useState(null);
    const operation = useRef(null);
    const inFlight = useRef(false);
    const variants = product.variants || [];
    const shared = variants.length > 0 && variants.every(v => Number(v.stock) === 0) && Number(product.stock) > 0;
    const requiresVariant = variants.length > 0 && !shared;
    const selected = variants.find(variant => variant._id === variantId);
    const balance = uncertain ? unconfirmedBalance : requiresVariant ? Number(selected?.stock) : Number(product.stock);
    const quantity = Number(delta);
    const nextBalance = balance + quantity;
    const validQuantity = delta !== "" && Number.isSafeInteger(quantity) && quantity !== 0;
    const invalidBalance = validQuantity && Number.isFinite(balance) && (!Number.isSafeInteger(nextBalance) || nextBalance < 0);
    const valid = validQuantity && !invalidBalance && (!requiresVariant || Boolean(selected)) && reason.trim().length > 0 && reason.length <= 1000;
    const frozen = busy || uncertain;

    const submit = async event => {
        event.preventDefault();
        if (inFlight.current || needsReload || (!uncertain && !valid)) return;
        inFlight.current = true; setBusy(true); onLockChange(true); setMessage("");
        const body = uncertain ? operation.current.body : { delta: quantity, reason: reason.trim(), expectedRevision: product.revision || 0, ...(requiresVariant ? { variantId } : {}) };
        const signature = JSON.stringify(body);
        if (operation.current?.signature !== signature) operation.current = { signature, body, balance, key: crypto.randomUUID() };
        let keepLocked = false;
        try {
            const { data } = await apiClient.post(`/products/${product._id}/stock-adjustments`, body, { headers: { "Idempotency-Key": operation.current.key } });
            if (!data.success || !data.product) throw new Error("Adjustment result could not be confirmed");
            queryClient.setQueryData(["products", "admin-edit", product._id], { success: true, product: data.product });
            void queryClient.invalidateQueries({ queryKey: ["products"] });
            operation.current = null; setUncertain(false); setDelta(""); setReason("");
            onAdjusted(data.product);
        } catch (error) {
            const status = error.response?.status;
            if (!status || status >= 500) {
                keepLocked = true; setUnconfirmedBalance(operation.current.balance); setUncertain(true);
                setMessage("The result is not confirmed. Retry this same adjustment to check its result before closing. It will use the same request key.");
            } else {
                setUncertain(false);
                setNeedsReload(status === 409);
                setMessage(error.response?.data?.message || "Could not adjust stock. Check the details and try again.");
            }
        } finally { inFlight.current = false; setBusy(false); onLockChange(keepLocked); }
    };
    const reload = async () => {
        if (inFlight.current) return;
        inFlight.current = true; setBusy(true); onLockChange(true);
        try {
            const result = await onReload();
            if (result.error) throw result.error;
            operation.current = null; setNeedsReload(false); setMessage("");
        } catch { setMessage("Could not refresh inventory. Try reloading stock again."); }
        finally { inFlight.current = false; setBusy(false); onLockChange(false); }
    };
    return <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
        <p className="text-sm leading-6 text-gray-600">Record stock received, damaged or corrected with a reason. Current product total: <strong className="text-gray-900">{product.stock}</strong>.</p>
        {shared && <p className="rounded-lg bg-primary-pale p-3 text-sm text-primary-dark">This product uses a shared stock balance for its variants.</p>}
        {requiresVariant && <label className="block text-sm font-medium text-gray-700">Variant (required)<select required disabled={frozen} className={control} value={variantId} onChange={e => setVariantId(e.target.value)}>
            <option value="">Choose a variant</option>{variants.map(variant => <option key={variant._id} value={variant._id}>{variant.name} · {variant.stock} in stock{variant.active === false ? " · Inactive" : ""}</option>)}
        </select></label>}
        <label className="block text-sm font-medium text-gray-700">Quantity change (required)<input required disabled={frozen} type="number" step="1" className={control} value={delta} onChange={e => setDelta(e.target.value)} placeholder="e.g. 5 to add, -2 to remove" aria-invalid={invalidBalance} aria-describedby="stock-change-help" /></label>
        <p id="stock-change-help" className={`text-sm ${invalidBalance ? "text-red-700" : "text-gray-500"}`}>{invalidBalance ? "This adjustment would create a negative or invalid stock balance." : "Use a positive whole number to add stock or a negative number to remove it."}</p>
        <div aria-live="polite" aria-atomic="true" className="grid grid-cols-3 gap-2 rounded-xl border border-primary-light bg-primary-pale/40 p-4 text-center">
            <div><p className="text-xs text-gray-600">Current stock</p><p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">{Number.isFinite(balance) ? balance : "—"}</p></div>
            <div><p className="text-xs text-gray-600">Change</p><p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">{validQuantity ? `${quantity > 0 ? "+" : ""}${quantity}` : "—"}</p></div>
            <div><p className="text-xs text-gray-600">New stock</p><p className={`mt-1 text-lg font-semibold tabular-nums ${invalidBalance ? "text-red-700" : "text-primary-dark"}`}>{validQuantity && Number.isFinite(balance) ? nextBalance : "—"}</p></div>
        </div>
        <label className="block text-sm font-medium text-gray-700">Reason (required)<textarea required disabled={frozen} maxLength={1000} className={`${control} min-h-24 resize-y`} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Received supplier delivery" /></label>
        {message && <div role="alert" className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p>{message}</p>{needsReload && <button type="button" onClick={reload} disabled={busy} className="min-h-11 rounded-lg border border-amber-400 bg-white px-4 font-semibold">Reload current stock</button>}</div>}
        <button disabled={busy || needsReload || (!uncertain && !valid)} className="min-h-12 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Recording…" : uncertain ? "Check adjustment result" : "Record adjustment"}</button>
    </form>;
}
