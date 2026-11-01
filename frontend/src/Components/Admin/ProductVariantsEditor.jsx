import VariantImagePicker from "./VariantImagePicker";
import { useId, useRef, useState } from "react";
import { Plus, Trash2, Layers, LockKeyhole } from "lucide-react";
import Input from "../../UI/Input";

function VariantRow({ variant, index, images, otherVariants, isEditing, onChange, onRemove }) {
    const id = useId();
    const [confirmRemove, setConfirmRemove] = useState(false);
    const name = variant.name?.trim() || `Variant ${index + 1}`;
    const lockedStock = isEditing && Boolean(variant._id);
    const stock = Number(variant.stock) || 0;
    const active = variant.active !== false;
    const status = !active ? "Inactive" : stock === 0 ? "Out of stock" : stock <= Number(variant.lowStock ?? 5) ? "Low stock" : "In stock";
    const field = (key, label, props = {}) => <div className="min-w-0 space-y-1.5">
        <label htmlFor={`${id}-${key}`} className="block text-sm font-medium text-gray-700">{label}</label>
        <Input id={`${id}-${key}`} value={variant[key] ?? ""} onChange={event => onChange(index, key, event.target.value)} {...props} />
    </div>;
    return <fieldset className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <legend className="max-w-full px-2 text-sm font-semibold text-gray-900"><span className="break-words">{name}</span></legend>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${!active ? "bg-gray-100 text-gray-600" : stock === 0 ? "bg-red-50 text-red-700" : stock <= Number(variant.lowStock ?? 5) ? "bg-amber-50 text-amber-800" : "bg-primary-pale text-primary-dark"}`}>{status}</span>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" checked={active} onChange={event => onChange(index, "active", event.target.checked)} className="h-4 w-4 accent-primary-dark" />
                Available to customers<span className="sr-only">: {name}</span>
            </label>
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {field("name", "Variant name (required)", { placeholder: "e.g. Pack of 10", required: true, autoFocus: Boolean(variant._editorKey) })}
            {field("color", "Colour / option", { placeholder: "e.g. Blue or Unscented" })}
            {field("sku", "SKU", { placeholder: "Optional product code" })}
            {field("price", "Price (Rs) (required)", { type: "number", min: "0", step: "0.01", inputMode: "decimal", required: true, placeholder: "0.00" })}
            <div className="space-y-1.5">
                {field("stock", lockedStock ? "Stock quantity · managed separately" : "Stock quantity", { type: "number", min: "0", step: "1", inputMode: "numeric", required: true, readOnly: lockedStock, "aria-describedby": lockedStock ? `${id}-stock-hint` : undefined, className: lockedStock ? "bg-gray-50 text-gray-500" : undefined })}
                {lockedStock && <p id={`${id}-stock-hint`} className="flex items-start gap-1.5 text-xs leading-5 text-gray-500"><LockKeyhole size={13} className="mt-1 shrink-0" aria-hidden="true" />Use Adjust stock in All Products to change saved inventory.</p>}
            </div>
            {field("lowStock", "Low-stock alert at", { type: "number", min: "0", step: "1", inputMode: "numeric", placeholder: "5" })}
        </div>
        <div className="mt-5 space-y-4 border-t border-gray-100 pt-4">
            <VariantImagePicker variant={variant} images={images} otherVariants={otherVariants} onChange={imageIndices => onChange(index, "imageIndices", imageIndices)} />
            <button type="button" onClick={() => setConfirmRemove(true)} aria-label={`Remove ${name}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"><Trash2 size={16} aria-hidden="true" />Remove variant</button>
        </div>
        {confirmRemove && <div role="group" aria-label={`Confirm removal of ${name}`} className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">Remove {name}? This change takes effect when you save the product.</p>
            <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setConfirmRemove(false)} className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700">Keep variant</button>
                <button type="button" onClick={() => onRemove(index)} className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800">Confirm removal</button>
            </div>
        </div>}
    </fieldset>;
}

export default function ProductVariantsEditor({ variants = [], images = [], isEditing, onAdd, onChange, onRemove }) {
    const titleId = useId();
    const addButton = useRef(null);
    const active = variants.filter(variant => variant.active !== false);
    const prices = active.filter(variant => variant.price !== "" && variant.price != null).map(variant => Number(variant.price)).filter(Number.isFinite);
    const stock = active.reduce((total, variant) => total + (Number(variant.stock) || 0), 0);
    return <section aria-labelledby={titleId} className="space-y-5 border-t border-gray-100 pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0"><h3 id={titleId} className="flex items-center gap-2 text-base font-semibold text-gray-900"><Layers size={18} className="text-primary-dark" aria-hidden="true" />Product variants</h3><p className="mt-1 text-sm leading-6 text-gray-500">Manage pack sizes, colours or other options with their own price and stock.</p></div>
            <button ref={addButton} type="button" onClick={onAdd} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary-dark px-4 text-sm font-semibold text-primary-dark transition-colors hover:bg-primary-pale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"><Plus size={17} aria-hidden="true" />Add variant</button>
        </div>
        {!variants.length ? <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-7 text-center"><p className="text-sm font-medium text-gray-900">One product, multiple options</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">Add a variant when an option needs its own price or inventory. Otherwise, use the product price and stock below.</p></div> : <>
            <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-xl bg-primary-pale/50 px-4 py-3 text-sm text-primary-dark">
                <span>{active.length} of {variants.length} active</span><span>{stock.toLocaleString()} units in stock</span>
                <span>{prices.length ? `Rs ${Math.min(...prices).toLocaleString()}${Math.min(...prices) !== Math.max(...prices) ? ` – ${Math.max(...prices).toLocaleString()}` : ""}` : "Set a price for active variants"}</span>
            </div>
            <div className="space-y-4">{variants.map((variant, index) => <VariantRow key={variant._id || variant._editorKey || index} variant={variant} index={index} images={images} otherVariants={variants.filter((_, otherIndex) => otherIndex !== index)} isEditing={isEditing} onChange={onChange} onRemove={index => { onRemove(index); addButton.current?.focus({ preventScroll: true }); }} />)}</div>
        </>}
    </section>;
}
