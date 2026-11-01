import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion as Motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useDialog } from "../../hooks/useDialog";
import { useProductForEdit } from "../../api/hooks/product.api";
import { PageLoading } from "../UI/PageLoading";
import { QueryError } from "../../UI/QueryState";
import StockAdjustmentPanel from "./StockAdjustmentPanel";

function StockModalSurface({ productId, onClose, onAdjusted }) {
    const panel = useRef(null);
    const locked = useRef(false);
    const [busy, setBusy] = useState(false);
    const id = useId();
    const reduceMotion = useReducedMotion();
    const close = () => { if (!locked.current) onClose(); };
    useDialog(true, close, panel);
    const { data, loading, error, refetch } = useProductForEdit(productId);
    const product = data?.product;
    const duration = reduceMotion ? 0.1 : 0.22;
    return <Motion.div className="fixed inset-0 z-[1001] grid place-items-center p-4" initial="closed" animate="open" exit="closed">
        <Motion.div data-dialog-backdrop="" aria-hidden="true" onClick={close} className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm"
            variants={{ closed: { opacity: 0 }, open: { opacity: 1 } }} transition={{ duration }} />
        <Motion.div ref={panel} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-6"
            variants={{ closed: { opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.98 }, open: { opacity: 1, y: 0, scale: 1 } }} transition={{ duration, ease: [0.22, 1, 0.36, 1] }}>
            <header className="mb-5 flex items-start justify-between gap-3 border-b border-gray-200 pb-4">
                <div className="min-w-0"><h2 id={id} className="text-xl font-semibold text-gray-900">Adjust stock</h2>{product && <p className="mt-1 break-words text-sm text-gray-600">{product.name}</p>}</div>
                <button type="button" disabled={busy} onClick={close} aria-label="Close stock adjustment" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40"><X size={20} aria-hidden="true" /></button>
            </header>
            {product ? <StockAdjustmentPanel product={product} onAdjusted={onAdjusted} onReload={refetch} onLockChange={value => { locked.current = value; setBusy(value); }} />
                : error ? <QueryError message={error.response?.data?.message || "Could not load current inventory."} onRetry={() => refetch()} />
                    : loading ? <PageLoading variant="form" /> : <QueryError message="Product is unavailable." onRetry={() => refetch()} />}
        </Motion.div>
    </Motion.div>;
}

export default function StockAdjustmentModal({ productId, onClose, onAdjusted }) {
    return createPortal(<AnimatePresence>{productId && <StockModalSurface key={productId} productId={productId} onClose={onClose} onAdjusted={onAdjusted} />}</AnimatePresence>, document.body);
}
