import { useEffect, useState } from "react";
import { useGetActiveDeals } from "../api/hooks/promotion.api";
import PromotionCard from "../Components/Promotion/PromotionCard";
import { Tag } from "lucide-react";

const PromotionsPage = () => {
    const { getActiveDeals, loading } = useGetActiveDeals();
    const [deals, setDeals] = useState([]);
    const [currentTime, setCurrentTime] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        getActiveDeals().then((res) => {
            if (res && res.data) {
                setDeals(res.data);
            }
        });
    }, [getActiveDeals]);

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="py-8">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex flex-col items-center text-center mb-8 space-y-3 pb-6 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <Tag className="text-blue-600" size={20} />
                            <span className="text-sm text-gray-500 font-medium">
                                Exclusive Offers
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
                            Active Promotions
                        </h1>
                        <p className="text-gray-600 max-w-lg text-sm">
                            Discover our latest deals and limited-time offers. Grab your favorites before they expire!
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
                        </div>
                    ) : deals.length === 0 ? (
                        <div className="text-center py-20 bg-white border border-gray-200 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-400">
                                No Active Promotions
                            </h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Check back soon for new deals!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {deals.map((deal) => (
                                <PromotionCard
                                    key={deal._id}
                                    deal={deal}
                                    currentTime={currentTime}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PromotionsPage;