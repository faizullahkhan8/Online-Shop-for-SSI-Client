export const FILTER_KEYS = ["search", "category", "brand", "vendor", "minPrice", "maxPrice", "availability", "onSale", "minRating"];
export const SORT_OPTIONS = [
    ["relevance", "Most relevant"], ["newest", "Newest arrivals"], ["price_asc", "Price: low to high"],
    ["price_desc", "Price: high to low"], ["bestselling", "Best-selling"], ["rating", "Highest rated"],
];
export const emptyFilters = () => ({ search: "", category: [], brand: [], vendor: [], minPrice: "", maxPrice: "", availability: "", onSale: false, minRating: "" });
export function readCatalogFilters(params) {
    const values = key => [...new Set(params.getAll(key).map(v => v.trim()).filter(Boolean))].sort();
    return { search: params.get("search") || "", category: values("category"), brand: values("brand"), vendor: values("vendor"), minPrice: params.get("minPrice") || "", maxPrice: params.get("maxPrice") || "", availability: params.get("availability") || "", onSale: params.get("onSale") === "true", minRating: params.get("minRating") || "" };
}
export function writeCatalogFilters(params, updates, { resetPage = true } = {}) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) {
        if (!FILTER_KEYS.includes(key)) continue;
        next.delete(key);
        if (Array.isArray(value)) [...new Set(value)].filter(Boolean).sort().forEach(item => next.append(key, item));
        else if (value !== "" && value !== null && value !== undefined && value !== false) next.set(key, String(value));
    }
    if (resetPage) next.delete("page");
    return next;
}
export function clearCatalogFilters(params) {
    const next = new URLSearchParams(params);
    [...FILTER_KEYS, "page"].forEach(key => next.delete(key));
    return next;
}
export function filterCount(f) {
    return f.category.length + f.brand.length + f.vendor.length + Number(Boolean(f.search)) + Number(Boolean(f.minPrice || f.maxPrice)) + Number(Boolean(f.availability)) + Number(f.onSale) + Number(Boolean(f.minRating));
}
export function priceError(min, max) {
    if ([min, max].some(value => value !== "" && (!String(value).trim() || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1e12))) return "Enter a valid, non-negative price.";
    if (min !== "" && max !== "" && Number(min) > Number(max)) return "Minimum price must be less than or equal to maximum price.";
    return "";
}
export function catalogQuery(filters, params) {
    const page = Number(params.get("page") || 1);
    return { ...Object.fromEntries(Object.entries(filters).filter(([, value]) => Array.isArray(value) ? value.length : value !== "" && value !== false)), page: Number.isSafeInteger(page) && page > 0 ? page : 1, sort: params.get("sort") || (filters.search ? "relevance" : "newest"), limit: 12, facets: "true" };
}
export function categoryOptions(categories = []) {
    const result = [], seen = new Set();
    function visit(item, depth) {
        if (seen.has(item.value)) return;
        seen.add(item.value); result.push({ ...item, depth });
        categories.filter(child => child.parentId === item.value).forEach(child => visit(child, depth + 1));
    }
    categories.filter(item => !item.parentId || !categories.some(parent => parent.value === item.parentId)).forEach(item => visit(item, 0));
    categories.forEach(item => visit(item, 0));
    return result;
}
export function filterChips(filters, facets = {}) {
    const chips = [];
    if (filters.search) chips.push({ key: "search", label: `Search: ${filters.search}` });
    for (const [key, facet] of [["category", "categories"], ["brand", "brands"], ["vendor", "vendors"]]) {
        filters[key].forEach(value => chips.push({ key, value, label: (facets[facet] || []).find(option => option.value === value)?.label || value }));
    }
    if (filters.minPrice || filters.maxPrice) chips.push({ key: "price", label: `Rs ${filters.minPrice || "0"}${filters.maxPrice ? ` – ${filters.maxPrice}` : "+"}` });
    if (filters.availability) chips.push({ key: "availability", label: filters.availability === "in_stock" ? "In stock" : "Out of stock" });
    if (filters.onSale) chips.push({ key: "onSale", label: "On offer" });
    if (filters.minRating) chips.push({ key: "minRating", label: `${filters.minRating} stars & up` });
    return chips;
}
