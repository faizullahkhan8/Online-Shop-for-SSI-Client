import { useEffect, useState, memo } from "react";
import { Clock, Tag, ChevronRight } from "lucide-react";
import { useGetActiveDeals } from "../../api/hooks/promotion.api";
import { Link } from "react-router-dom";

// Compact Countdown Timer
const CompactTimer = memo(({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const update = () => {
            const distance = new Date(endTime).getTime() - Date.now();
            if (distance < 0) {
                setTimeLeft("EXPIRED");
                return;
            }
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (days > 0) setTimeLeft(`${days}d ${hours}h`);
            else setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [endTime]);

    return (
        <div className="flex items-center gap-1 text-xs text-gray-600">
            <Clock size={14} />
            <span className="font-medium">{timeLeft}</span>
        </div>
    );
});

const PromotionSection = () => {
    const { getActiveDeals, loading } = useGetActiveDeals();
    const [deals, setDeals] = useState([]);

    useEffect(() => {
        getActiveDeals().then((res) => {
            if (res && res.data) {
                setDeals(res.data);
            }
        });
    }, [getActiveDeals]);

    if (loading || deals.length === 0) return null;

    return (
        <section className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        Special Offers
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Limited time deals
                    </p>
                </div>
                <Link
                    to="/promotions"
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                    View All
                    <ChevronRight size={16} />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deals.map((deal) => (
                    <Link
                        key={deal._id}
                        to="/promotions"
                        className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all duration-200"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${deal.type === "FLASH_DEAL"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-green-50 text-green-700 border border-green-200"
                                }`}>
                                <Tag size={12} />
                                {deal.type.replace("_", " ")}
                            </span>
                            {deal.type === "FLASH_DEAL" && (
                                <CompactTimer endTime={deal.endTime} />
                            )}
                        </div>

                        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {deal.title}
                        </h3>

                        <p className="text-sm text-gray-600 mb-3">
                            {deal.discountType === "PERCENTAGE"
                                ? `${deal.discountValue}% discount`
                                : `Save PKR ${deal.discountValue}`
                            }
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-500">
                                {deal.products.length} {deal.products.length === 1 ? 'product' : 'products'}
                            </span>
                            <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default PromotionSection;