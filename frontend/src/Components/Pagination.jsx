import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage = 1, totalPages = 5, onPageChange }) => {
    return (
        <div className="flex justify-end items-center gap-4 mt-8">
            <div className="relative">
                <select className="appearance-none bg-white border border-gray-300 text-gray-700 py-1.5 pl-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm">
                    <option>Show 10</option>
                    <option>Show 20</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 text-xs">
                    ▼
                </div>
            </div>

            <div className="flex border border-gray-300 rounded bg-white overflow-hidden">
                <button 
                    onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border-r border-gray-300 hover:bg-gray-50 text-gray-500 disabled:opacity-50"
                >
                    <ChevronLeft size={20} />
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                    <button 
                        key={i + 1}
                        onClick={() => onPageChange && onPageChange(i + 1)}
                        className={`px-4 py-1.5 border-r border-gray-300 hover:bg-gray-50 font-medium ${currentPage === i + 1 ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
                    >
                        {i + 1}
                    </button>
                ))}

                <button 
                    onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 hover:bg-gray-50 text-gray-500 disabled:opacity-50"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
