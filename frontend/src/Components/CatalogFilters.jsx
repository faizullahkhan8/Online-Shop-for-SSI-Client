import { useId, useState } from "react";
import AnimatedDrawer from "./AnimatedDrawer";
import { SlidersHorizontal, X } from "lucide-react";
import { categoryOptions, emptyFilters, priceError } from "../utils/catalogFilters";

const fieldClass = "w-full min-h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark";
function Options({ title, options = [], selected, onChange }) {
    const [search, setSearch] = useState("");
    const choices = [...options, ...selected.filter(value => !options.some(option => option.value === value)).map(value => ({ value, label: value, count: 0 }))];
    const shown = choices.filter(option => option.label.toLowerCase().includes(search.toLowerCase()));
    const id = useId();
    return <fieldset className="border-b border-gray-200 pb-5"><legend className="mb-3 text-sm font-semibold text-gray-900">{title}</legend>
        {choices.length > 8 && <label className="mb-2 block"><span className="sr-only">Find {title.toLowerCase()}</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={`Find ${title.toLowerCase()}`} className={fieldClass} /></label>}
        <div className="max-h-64 space-y-0.5 overflow-y-auto overscroll-contain pr-1">{shown.map(option => <label key={option.value} htmlFor={`${id}-${option.value}`} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg py-2 pr-2 text-sm text-gray-700 hover:bg-primary-pale/50" style={{ paddingLeft: `${8 + Math.min(option.depth || 0, 4) * 12}px` }}>
            <input id={`${id}-${option.value}`} type="checkbox" checked={selected.includes(option.value)} onChange={e => onChange(e.target.checked ? [...selected, option.value] : selected.filter(v => v !== option.value))} className="h-4 w-4 shrink-0 accent-primary-dark" />
            <span className="min-w-0 flex-1 break-words">{option.label}</span><span className="shrink-0 text-xs tabular-nums text-gray-500">{option.count ?? 0}</span>
        </label>)}{!shown.length && <p className="py-3 text-sm text-gray-500">No matching options.</p>}</div>
    </fieldset>;
}
function PriceFilter({ filters, onChange, mobile, range }) {
    const source = `${filters.minPrice}:${filters.maxPrice}`;
    const [draft, setDraft] = useState({ source, minPrice: filters.minPrice, maxPrice: filters.maxPrice });
    // A URL navigation resets the draft without replacing the focused input nodes.
    if (!mobile && draft.source !== source) setDraft({ source, minPrice: filters.minPrice, maxPrice: filters.maxPrice });
    const values = mobile ? filters : draft;
    const error = priceError(values.minPrice, values.maxPrice);
    const id = useId();
    const change = (key, value) => mobile ? onChange({ [key]: value }) : setDraft(prev => ({ ...prev, [key]: value }));
    return <fieldset className="border-b border-gray-200 pb-5"><legend className="mb-3 text-sm font-semibold text-gray-900">Price in rupees</legend><div className="grid grid-cols-2 gap-3">{[["minPrice", "Minimum", range?.min], ["maxPrice", "Maximum", range?.max]].map(([key, label, placeholder]) => <label key={key} className="space-y-1.5 text-xs text-gray-600"><span>{label}</span><input type="number" min="0" max="1000000000000" step="0.01" inputMode="decimal" value={values[key]} placeholder={placeholder == null ? "Any" : String(placeholder)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={e => change(key, e.target.value)} className={fieldClass} /></label>)}</div>
        {error && <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
        {!mobile && <button type="button" disabled={Boolean(error)} onClick={() => onChange({ minPrice: draft.minPrice, maxPrice: draft.maxPrice })} className="mt-3 min-h-11 w-full rounded-lg border border-primary-dark px-3 text-sm font-semibold text-primary-dark hover:bg-primary-pale disabled:cursor-not-allowed disabled:opacity-50">Apply price</button>}
    </fieldset>;
}
export function FilterPanel({ filters, facets = {}, onChange, mobile = false, updating = false }) {
    const id = useId();
    return <div className="space-y-5">
        {!mobile && <div className="flex items-center justify-between border-b border-gray-200 pb-4"><h2 className="flex items-center gap-2 text-base font-semibold text-gray-900"><SlidersHorizontal size={17} aria-hidden="true" />Filters</h2>{updating && <span className="text-xs text-gray-500">Updating…</span>}</div>}
        <Options title="Categories" options={categoryOptions(facets.categories)} selected={filters.category} onChange={category => onChange({ category })} />
        <PriceFilter filters={filters} onChange={onChange} mobile={mobile} range={facets.priceRange} />
        {(facets.brands?.length > 0 || filters.brand.length > 0) && <Options title="Brands" options={facets.brands} selected={filters.brand} onChange={brand => onChange({ brand })} />}
        {(facets.vendors?.length > 0 || filters.vendor.length > 0) && <Options title="Suppliers" options={facets.vendors} selected={filters.vendor} onChange={vendor => onChange({ vendor })} />}
        <fieldset className="border-b border-gray-200 pb-5"><legend className="mb-3 text-sm font-semibold text-gray-900">Availability</legend>{[["", "Any availability"], ["in_stock", "In stock"], ["out_of_stock", "Out of stock"]].map(([value, label]) => <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-gray-700 hover:bg-primary-pale/50"><input name={`${id}-availability`} type="radio" checked={filters.availability === value} onChange={() => onChange({ availability: value })} className="h-4 w-4 accent-primary-dark" />{label}</label>)}</fieldset>
        <fieldset className="border-b border-gray-200 pb-5"><legend className="mb-3 text-sm font-semibold text-gray-900">Customer rating</legend>{[["", "Any rating"], ["4", "4 stars & up"], ["3", "3 stars & up"]].map(([value, label]) => <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-gray-700 hover:bg-primary-pale/50"><input name={`${id}-rating`} type="radio" checked={filters.minRating === value} onChange={() => onChange({ minRating: value })} className="h-4 w-4 accent-primary-dark" />{label}</label>)}</fieldset>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm font-medium text-gray-900 hover:bg-primary-pale/50"><input type="checkbox" checked={filters.onSale} onChange={e => onChange({ onSale: e.target.checked })} className="h-4 w-4 accent-primary-dark" />Products on offer</label>
    </div>;
}
export function MobileFilters({ isOpen, applied, facets, onApply, onClose }) {
    const id = useId();
    return <AnimatedDrawer isOpen={isOpen} onClose={onClose} labelledBy={id} className="w-full max-w-sm">
        <MobileFilterContent applied={applied} facets={facets} onApply={onApply} onClose={onClose} titleId={id} />
    </AnimatedDrawer>;
}
function MobileFilterContent({ applied, facets, onApply, onClose, titleId }) {
    const [draft, setDraft] = useState(applied);
    const error = priceError(draft.minPrice, draft.maxPrice);
    return <>
            <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3"><h2 id={titleId} className="text-lg font-semibold">Filter products</h2><button type="button" onClick={onClose} aria-label="Close filters" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100"><X size={20} /></button></header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5"><FilterPanel filters={draft} facets={facets} mobile onChange={patch => setDraft(prev => ({ ...prev, ...patch }))} /></div>
            <footer className="shrink-0 border-t border-gray-200 bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><div className="flex gap-3"><button type="button" onClick={() => setDraft(emptyFilters())} className="min-h-12 rounded-xl border border-gray-300 px-5 text-sm font-semibold">Reset</button><button type="button" disabled={Boolean(error)} onClick={() => { onApply(draft); onClose(); }} className="min-h-12 flex-1 rounded-xl bg-primary-dark px-4 text-sm font-semibold text-white hover:bg-primary disabled:opacity-50">Apply filters</button></div>{error && <p className="mt-2 text-xs text-red-700">Check the price range before applying.</p>}</footer>
    </>;
}
