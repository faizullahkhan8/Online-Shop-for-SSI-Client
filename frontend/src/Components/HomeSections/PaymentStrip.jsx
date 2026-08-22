import { Link } from "react-router-dom";
import { CreditCard } from "lucide-react";

const PaymentStrip = ({ config }) => {
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-4">
            <div className="rounded-2xl bg-gradient-to-r from-primary-dark to-primary-dark/90 border-2 border-primary-dark px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg shadow-primary-dark/20">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-md">
                        <CreditCard size={22} />
                    </div>
                    <div>
                        <p className="text-base font-black text-white">{config.title}</p>
                        <p className="text-xs font-bold text-primary-pale mt-1">{config.subtitle}</p>
                    </div>
                </div>
                <Link to={config.ctaLink || "/promotions"}
                    className="shrink-0 px-6 py-3 bg-primary hover:bg-white hover:text-primary-dark text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                    {config.ctaText || "View Offers"}
                </Link>
            </div>
        </section>
    );
};

export default PaymentStrip;
