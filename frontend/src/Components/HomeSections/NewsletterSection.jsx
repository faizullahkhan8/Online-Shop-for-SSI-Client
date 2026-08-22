import { Mail } from "lucide-react";

const NewsletterSection = ({ config }) => {
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
            <div className="rounded-3xl p-8 sm:p-12 md:p-16 text-center flex flex-col items-center justify-center border border-primary-light shadow-sm" style={{ backgroundColor: config.bgColor || "#ebf7d9" }}>
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 text-primary shadow-sm border border-primary-light">
                    <Mail size={28} strokeWidth={2} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 tracking-tight">{config.title}</h3>
                <p className="text-sm font-bold text-gray-700 mb-8 max-w-md">{config.subtitle}</p>
                <form className="w-full max-w-md flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-primary-light focus-within:border-primary focus-within:shadow-md transition-all" onSubmit={e => e.preventDefault()}>
                    <input 
                        type="email" 
                        placeholder={config.placeholder} 
                        className="flex-1 px-4 py-3 bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-bold text-gray-900 placeholder-gray-400" 
                    />
                    <button 
                        type="submit" 
                        className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-black uppercase tracking-widest rounded-xl text-xs transition-colors shadow-sm"
                    >
                        {config.ctaText}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default NewsletterSection;
