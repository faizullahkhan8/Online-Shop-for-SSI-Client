import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const SectionHeader = ({ title, subtitle, cta, ctaPath }) => (
    <div className="flex items-end justify-between mb-7">
        <div>
            <div className="flex items-center gap-2 mb-1.5">
                <span className="block w-5 h-[2px] rounded-full bg-primary" />
                {/* Plus Jakarta Sans label — ultra-clear tracking for category labels */}
                <span className="font-sans text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">
                    {subtitle || "Curated For You"}
                </span>
            </div>
            {/* Plus Jakarta Sans h2 — geometric, bold, modern section titles */}
            <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                {title}
            </h2>
        </div>
        {cta && (
            <Link
                to={ctaPath || "/products"}
                className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary-dark uppercase tracking-[0.14em] transition-colors group"
            >
                {cta}
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
        )}
    </div>
);

export default SectionHeader;
