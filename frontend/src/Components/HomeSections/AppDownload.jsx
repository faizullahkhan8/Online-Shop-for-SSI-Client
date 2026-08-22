import { Smartphone, QrCode, Star } from "lucide-react";

const AppDownload = ({ config }) => {
    const titleLines = (config.title || "").split("\n");
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
            <div className="relative rounded-3xl bg-primary-pale/40 border border-primary-light overflow-hidden shadow-sm">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Decorative circles */}
                    <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute -left-10 -bottom-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 p-8 sm:p-12 md:p-16">
                    
                    <div className="text-center md:text-left space-y-5 flex-1 max-w-xl">
                        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-primary-light shadow-sm">
                            <Smartphone size={16} className="text-primary" />
                            <span className="text-xs font-black text-primary-dark uppercase tracking-widest">Zada Mobile App</span>
                        </div>
                        <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                            {titleLines.map((line, i) => <span key={i}>{line}{i < titleLines.length - 1 && <br />}</span>)}
                        </h3>
                        <p className="text-sm md:text-base font-bold text-gray-600 leading-relaxed max-w-md mx-auto md:mx-0">
                            {config.subtitle}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-3 justify-center md:justify-start">
                            <a href={config.appStoreLink || "#"} className="flex items-center gap-3 bg-gray-900 hover:bg-black text-white px-6 py-3.5 rounded-2xl text-xs font-black shadow-md hover:shadow-xl hover:-translate-y-1 transition-all">
                                <span className="text-2xl leading-none">📱</span> 
                                <div className="text-left leading-tight">
                                    <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Download on the</span>
                                    <span className="block text-sm">{config.appStoreBadge || "App Store"}</span>
                                </div>
                            </a>
                            <a href={config.playStoreLink || "#"} className="flex items-center gap-3 bg-gray-900 hover:bg-black text-white px-6 py-3.5 rounded-2xl text-xs font-black shadow-md hover:shadow-xl hover:-translate-y-1 transition-all">
                                <span className="text-2xl leading-none">▶</span> 
                                <div className="text-left leading-tight">
                                    <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Get it on</span>
                                    <span className="block text-sm">{config.playStoreBadge || "Google Play"}</span>
                                </div>
                            </a>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-5 shrink-0 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-primary-dark/5 transform hover:scale-105 transition-transform duration-500">
                        <div className="w-32 h-32 bg-gray-50 rounded-2xl p-3 flex items-center justify-center border border-gray-100">
                            <QrCode size={100} strokeWidth={1} className="text-gray-900" />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Scan to Download</p>
                            <div className="flex items-center justify-center gap-1 text-amber-400 mb-1.5">
                                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" strokeWidth={0} />)}
                            </div>
                            <p className="text-xs font-bold text-gray-500">{config.rating} Rating · {config.reviewCount} Reviews</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default AppDownload;
