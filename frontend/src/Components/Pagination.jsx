import { ChevronLeft, ChevronRight } from "lucide-react";
const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
    const count = Math.max(1, Number(totalPages) || 1);
    const current = Math.min(count, Math.max(1, Number(currentPage) || 1));
    const pages = [...new Set([1, current - 1, current, current + 1, count])].filter(page => page > 0 && page <= count).sort((a,b) => a-b);
    return <nav aria-label="Pagination" className="w-full flex flex-wrap justify-between items-center gap-3 text-sm">
        <p className="text-gray-600">Page {current} of {count}</p>
        <div className="flex items-center gap-1">
            <button type="button" aria-label="Previous page" disabled={current <= 1} onClick={() => onPageChange?.(current - 1)} className="h-11 w-11 grid place-items-center rounded-xl border border-gray-200 bg-white hover:bg-primary-pale disabled:opacity-40"><ChevronLeft size={18} /></button>
            {pages.map((page,index) => <span key={page} className="flex items-center gap-1">{index > 0 && page - pages[index-1] > 1 && <span aria-hidden="true" className="px-1 text-gray-500">…</span>}<button type="button" aria-label={`Page ${page}`} aria-current={page === current ? "page" : undefined} onClick={() => onPageChange?.(page)} className={`h-11 min-w-10 rounded-xl border px-2 font-medium ${page === current ? "bg-primary text-white border-primary" : "bg-white text-gray-700 border-gray-200 hover:bg-primary-pale"}`}>{page}</button></span>)}
            <button type="button" aria-label="Next page" disabled={current >= count} onClick={() => onPageChange?.(current + 1)} className="h-11 w-11 grid place-items-center rounded-xl border border-gray-200 bg-white hover:bg-primary-pale disabled:opacity-40"><ChevronRight size={18} /></button>
        </div>
    </nav>;
};
export default Pagination;
