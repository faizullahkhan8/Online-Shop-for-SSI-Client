import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const Pagination = ({ currentPage = 1, totalPages = 5, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 3) {
                end = Math.min(totalPages - 1, 4);
            }
            if (currentPage >= totalPages - 2) {
                start = Math.max(2, totalPages - 3);
            }

            if (start > 2) pages.push("...");
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex justify-center items-center gap-1.5 mt-10">
            <button
                onClick={() => onPageChange?.(1)}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary-pale disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="First page"
            >
                <ChevronsLeft size={16} />
            </button>
            <button
                onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-primary hover:bg-primary-pale disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Previous page"
            >
                <ChevronLeft size={16} />
            </button>

            {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">
                        ...
                    </span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange?.(page)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                            currentPage === page
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "text-gray-600 hover:bg-primary-pale hover:text-primary"
                        }`}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-primary hover:bg-primary-pale disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Next page"
            >
                <ChevronRight size={16} />
            </button>
            <button
                onClick={() => onPageChange?.(totalPages)}
                disabled={currentPage === totalPages}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary-pale disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Last page"
            >
                <ChevronsRight size={16} />
            </button>
        </div>
    );
};

export default Pagination;
