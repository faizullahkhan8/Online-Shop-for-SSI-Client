import { Link } from "react-router-dom";
import { FileText, Upload } from "lucide-react";

const RxUploadCta = ({ config }) => {
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
            <div className="rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden bg-primary-dark">
                {/* Decorative blob */}
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative z-10 flex items-center gap-5 md:gap-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md shadow-inner">
                        <FileText size={32} className="text-primary-pale" />
                    </div>
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5">{config.title}</h3>
                        <p className="text-sm font-bold text-primary-pale/90 max-w-md">{config.subtitle}</p>
                    </div>
                </div>
                
                <div className="relative z-10 w-full md:w-auto shrink-0">
                    <Link to={config.ctaLink} className="flex items-center justify-center gap-2 w-full md:w-auto bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-md hover:bg-primary-light hover:text-primary-dark hover:-translate-y-0.5 transition-all">
                        <Upload size={18} strokeWidth={3} /> {config.ctaText}
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default RxUploadCta;
