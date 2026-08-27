/**
 * Breadcrumb Component
 * Navigation breadcrumb trail showing current page hierarchy
 * 
 * Usage:
 * <Breadcrumb items={[
 *   { label: 'Home', path: '/' },
 *   { label: 'Products', path: '/products' },
 *   { label: 'Current Page' }
 * ]} />
 */

import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const Breadcrumb = ({ items = [] }) => {
    // Don't render if no items
    if (!items || items.length === 0) return null;

    return (
        <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                
                return (
                    <div key={index} className="flex items-center gap-2">
                        {/* Breadcrumb Item */}
                        {item.path && !isLast ? (
                            <Link 
                                to={item.path}
                                className="text-gray-500 hover:text-primary transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className={isLast ? "text-gray-900 font-medium" : "text-gray-500"}>
                                {item.label}
                            </span>
                        )}
                        
                        {/* Separator - don't show after last item */}
                        {!isLast && (
                            <ChevronRight size={16} className="text-gray-400" />
                        )}
                    </div>
                );
            })}
        </nav>
    );
};

export default Breadcrumb;
