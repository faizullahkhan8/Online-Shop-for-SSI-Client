import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LayoutGrid, List, PackageSearch, Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "../Components/ProductCard";
import ProductListItem from "../Components/ProductListItem";
import Pagination from "../Components/Pagination";
import Skeleton, { ProductGridSkeleton } from "../Components/UI/Skeleton";
import { FilterPanel, MobileFilters } from "../Components/CatalogFilters";
import { useCatalogProducts } from "../api/hooks/product.api";
import { SORT_OPTIONS, catalogQuery, clearCatalogFilters, filterChips, filterCount, readCatalogFilters, writeCatalogFilters } from "../utils/catalogFilters";

const productGrid = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4";
function CatalogSearch({ value, onSearch }) {
    const input = useRef(null);
    useEffect(() => { if (input.current) input.current.value = value; }, [value]);
    return <form role="search" onSubmit={event => { event.preventDefault(); onSearch(input.current.value.trim()); }} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-gray-300 bg-white pl-3.5 focus-within:border-primary-dark focus-within:ring-1 focus-within:ring-primary-dark">
        <Search size={18} aria-hidden="true" className="shrink-0 text-gray-500" /><label className="min-w-0 flex-1"><span className="sr-only">Search by product name, brand or SKU</span><input type="search" maxLength={250} ref={input} defaultValue={value} placeholder="Search by name, brand or SKU" className="min-h-12 w-full min-w-0 bg-transparent py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500" /></label>
        <button type="submit" className="m-1 min-h-11 rounded-lg bg-primary-dark px-3 text-sm font-semibold text-white transition-colors hover:bg-primary">Search</button>
    </form>;
}

export default function ProductListPage() {
    const [params, setParams] = useSearchParams();
    const filters = readCatalogFilters(params);
    const query = catalogQuery(filters, params);
    const { data, loading, refreshing, isPlaceholderData, error, refetch } = useCatalogProducts(query);
    const [mobileOpen, setMobileOpen] = useState(false);
    const resultsHeading = useRef(null);
    const view = params.get("view") === "list" ? "list" : "grid";
    const busy = loading || isPlaceholderData;
    const products = data?.products || [];
    const facets = data?.facets || {};
    const count = filterCount(filters);
    const chips = filterChips(filters, facets);
    const total = data?.totalProducts || 0;
    const totalPages = data?.totalPages || 0;
    const signature = params.toString();
    const change = patch => setParams(current => writeCatalogFilters(current, patch));
    const clear = () => setParams(current => clearCatalogFilters(current));

    useEffect(() => {
        if (!mobileOpen) return;
        const desktop = window.matchMedia("(min-width: 1024px)");
        const close = event => { if (event.matches) setMobileOpen(false); };
        desktop.addEventListener("change", close);
        return () => desktop.removeEventListener("change", close);
    }, [mobileOpen]);
    useEffect(() => {
        if (!data || refreshing || isPlaceholderData || query.page <= Math.max(1, totalPages)) return;
        const next = new URLSearchParams(signature); next.delete("page");
        setParams(next, { replace: true });
    }, [data, refreshing, isPlaceholderData, query.page, totalPages, signature, setParams]);

    const remove = chip => {
        if (chip.key === "price") change({ minPrice: "", maxPrice: "" });
        else if (chip.value) change({ [chip.key]: filters[chip.key].filter(value => value !== chip.value) });
        else change({ [chip.key]: chip.key === "onSale" ? false : "" });
    };
    const pageChange = page => {
        setParams(current => { const next = new URLSearchParams(current); next.set("page", String(page)); return next; });
        resultsHeading.current?.focus({ preventScroll: true });
        resultsHeading.current?.scrollIntoView({ block: "start" });
    };

    return <div className="min-h-screen bg-surface pb-10">
        <div className="site-shell py-6 lg:py-8">
            <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-xs text-gray-600"><Link to="/" className="rounded py-1 hover:text-primary-dark">Home</Link><span aria-hidden="true">/</span><span aria-current="page">All products</span></nav>
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-6"><div><h1 className="text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">All products</h1><p className="mt-2 text-sm text-gray-600">Find medicines, personal care and everyday essentials.</p></div></header>
            <div className="grid items-start gap-7 lg:grid-cols-[244px_minmax(0,1fr)] xl:gap-9">
                <aside aria-label="Product filters" className="hidden rounded-2xl border border-gray-200 bg-white p-5 lg:block">
                    {loading && !data?.facets ? <div aria-hidden="true" className="space-y-6"><Skeleton className="h-6 w-28" />{Array.from({ length: 3 }, (_, i) => <div key={i} className="space-y-4 border-t border-gray-100 pt-5"><Skeleton className="h-4 w-24" />{Array.from({ length: 4 }, (_, j) => <Skeleton key={j} className="h-7 w-full" />)}</div>)}</div> : <FilterPanel filters={filters} facets={facets} onChange={change} updating={refreshing} />}
                </aside>
                <section aria-label="Products" className="min-w-0">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row"><CatalogSearch value={filters.search} onSearch={search => change({ search })} /><button type="button" onClick={() => setMobileOpen(true)} disabled={loading && !data?.facets} aria-haspopup="dialog" aria-expanded={mobileOpen} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-primary-pale disabled:opacity-50 lg:hidden"><SlidersHorizontal size={17} aria-hidden="true" />Filters{count > 0 && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-dark px-1 text-xs text-white">{count}</span>}</button></div>
                    {chips.length > 0 && <div aria-label="Applied filters" className="mb-5 flex flex-wrap items-center gap-2">{chips.map(chip => <button type="button" key={`${chip.key}:${chip.value || ""}`} onClick={() => remove(chip)} aria-label={`Remove ${chip.label} filter`} className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-primary-light bg-primary-pale px-3 py-2 text-left text-xs font-medium text-primary-dark hover:border-primary"><span className="min-w-0 break-words">{chip.label}</span><X size={14} aria-hidden="true" className="shrink-0" /></button>)}<button type="button" onClick={clear} className="min-h-11 px-2 text-sm font-semibold text-primary-dark underline underline-offset-4">Clear all</button></div>}
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
                        <h2 ref={resultsHeading} tabIndex={-1} className="scroll-mt-48 rounded text-sm font-medium text-gray-700 focus-visible:outline-2 focus-visible:outline-primary-dark" role="status" aria-live="polite">{busy ? "Loading products…" : error ? "Results unavailable" : total ? `${(query.page - 1) * query.limit + 1}–${Math.min(query.page * query.limit, total)} of ${total} products` : "0 products"}</h2>
                        <div className="flex max-w-full flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-xs text-gray-600"><span>Sort by</span><select value={query.sort} onChange={event => setParams(current => { const next = new URLSearchParams(current); next.set("sort", event.target.value); next.delete("page"); return next; })} className="min-h-11 max-w-[180px] rounded-lg border border-gray-300 bg-white px-2 text-sm font-medium text-gray-900">{SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                            <div role="group" aria-label="Product layout" className="flex rounded-lg border border-gray-300 bg-white p-0.5">{[["grid", "Grid view"], ["list", "List view"]].map(([mode, label]) => <button key={mode} type="button" aria-label={label} aria-pressed={view === mode} onClick={() => setParams(current => { const next = new URLSearchParams(current); next.set("view", mode); return next; })} className={`flex h-11 w-11 items-center justify-center rounded-md ${view === mode ? "bg-primary-dark text-white" : "text-gray-500 hover:bg-gray-100"}`}>{mode === "grid" ? <LayoutGrid size={17} /> : <List size={17} />}</button>)}</div>
                        </div>
                    </div>
                    <div aria-busy={busy}>
                        {busy ? <div aria-hidden="true"><ProductGridSkeleton count={12} className={productGrid} /></div> : error ? <div role="alert" className="rounded-2xl border border-red-200 bg-white p-7"><h3 className="font-semibold text-gray-900">Products could not be loaded</h3><p className="mt-2 text-sm text-gray-600">{error.response?.data?.message || "Check your connection and try again. Your filters are still here."}</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => refetch()} className="min-h-11 rounded-lg bg-primary-dark px-4 text-sm font-semibold text-white">Try again</button>{count > 0 && <button type="button" onClick={clear} className="min-h-11 rounded-lg border border-gray-300 px-4 text-sm font-semibold">Clear filters</button>}</div></div> : !products.length ? <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center"><PackageSearch size={38} aria-hidden="true" className="mb-5 text-primary-dark" /><h3 className="text-xl font-semibold text-gray-900">{count ? "No products match these filters" : "No products available yet"}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-gray-600">{count ? "Try a wider price range, remove a filter or search with a different name." : "Check back soon, or refresh to see the latest catalog."}</p><button type="button" onClick={count ? clear : () => refetch()} className="mt-6 min-h-11 rounded-xl bg-primary-dark px-5 text-sm font-semibold text-white">{count ? "Clear filters" : "Refresh products"}</button></div> : <div className={view === "grid" ? productGrid : "space-y-4"}>{products.map(product => view === "grid" ? <ProductCard key={product._id} product={product} /> : <ProductListItem key={product._id} product={product} />)}</div>}
                    </div>
                    {!busy && !error && products.length > 0 && <Pagination currentPage={query.page} totalPages={totalPages} onPageChange={pageChange} />}
                </section>
            </div>
        </div>
        <MobileFilters isOpen={mobileOpen} applied={filters} facets={facets} onApply={change} onClose={() => setMobileOpen(false)} />
    </div>;
}
