import { memo } from "react";
import { Clock, Tag, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { handleImageError } from "../../utils/imageHelper";

// Compact Time Unit Component
const TimeUnit = memo(({ value, suffix }) => (
    <div className="flex items-center">
        <span className="bg-white border border-gray-200 px-2 py-1 rounded text-sm font-semibold text-gray-900 min-w-[40px] text-center">
            {String(value).padStart(2, "0")}
            <span className="text-xs ml-0.5 text-gray-500">{suffix}</span>
        </span>
    </div>
));

const CountdownTimer = memo(({ endTime, currentTime }) => {
    const distance = new Date(endTime).getTime() - currentTime;

    if (distance < 0) {
        return (
            <div className="text-xs font-medium text-red-600">
                Deal Expired
            </div>
        );
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    return (
        <div className="flex gap-1.5 text-sm font-semibold text-gray-900">
            {days > 0 && <TimeUnit value={days} suffix="d" />}
            <TimeUnit value={hours} suffix="h" />
            <TimeUnit value={minutes} suffix="m" />
            <TimeUnit value={seconds} suffix="s" />
        </div>
    );
});

const PromotionTimeline = memo(({ startTime, endTime, currentTime }) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const now = currentTime;

    const total = end - start;
    const elapsed = now - start;
    const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));

    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">
                    Progress
                </span>
                <span className="text-xs font-medium text-gray-700">
                    {progress.toFixed(0)}% Complete
                </span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
});

const PromotionCard = ({ deal, currentTime }) => {
    return (
        <section className="group">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col lg:flex-row shadow-sm hover:shadow-md transition-shadow">
                {/* Info Section */}
                <div className="lg:w-80 shrink-0 p-6 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${deal.type === "FLASH_DEAL"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-green-50 text-green-700 border border-green-200"
                            }`}>
                            <Tag size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                            {deal.type.replace("_", " ")}
                        </span>
                    </div>

                    <h2 className="text-2xl font-semibold text-gray-900 mb-4 leading-tight">
                        {deal.title}
                    </h2>

                    {deal.type === "FLASH_DEAL" && (
                        <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock size={16} />
                                <span className="font-medium">Time Remaining:</span>
                            </div>
                            <CountdownTimer
                                endTime={deal.endTime}
                                currentTime={currentTime}
                            />
                        </div>
                    )}

                    {deal.type === "OFFER" && (
                        <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg inline-block mb-4">
                            <p className="text-xl font-semibold text-blue-700">
                                {deal.discountType === "PERCENTAGE"
                                    ? `${deal.discountValue}% OFF`
                                    : `SAVE PKR ${deal.discountValue}`}
                            </p>
                        </div>
                    )}

                    <PromotionTimeline
                        startTime={deal.startTime}
                        endTime={deal.endTime}
                        currentTime={currentTime}
                    />
                </div>

                {/* Products Section */}
                <div className="flex-1 p-6 bg-white">
                    <div className="flex flex-wrap gap-4">
                        {deal.products.map((product) => {
                            const originalPrice = product.price;
                            let discountedPrice = originalPrice;
                            if (deal.discountType === "PERCENTAGE") {
                                discountedPrice =
                                    originalPrice -
                                    (originalPrice * deal.discountValue) / 100;
                            } else {
                                discountedPrice =
                                    originalPrice - deal.discountValue;
                            }

                            return (
                                <Link
                                    key={product._id}
                                    to={`/product/${product._id}`}
                                    className="group/product bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:shadow-md transition-all w-[200px] flex flex-col"
                                >
                                    <div className="relative">
                                        <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
                                            {deal.discountType === "PERCENTAGE"
                                                ? `-${deal.discountValue}%`
                                                : `SAVE`}
                                        </div>

                                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 mb-3 p-3 border border-gray-100">
                                            <img
                                                src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${product.image}`}
                                                className="w-full h-full object-contain group-hover/product:scale-105 transition-transform duration-300"
                                                alt={product.name}
                                                onError={(e) => handleImageError(e, "product")}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                                            {product.name}
                                        </h4>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 line-through">
                                                PKR {originalPrice.toLocaleString()}
                                            </span>
                                            <span className="text-lg font-semibold text-blue-600">
                                                PKR {discountedPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100">
                                        <span className={`text-xs font-medium ${product.stock > 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                            }`}>
                                            {product.stock > 0
                                                ? "In Stock"
                                                : "Out of Stock"}
                                        </span>
                                        <ChevronRight
                                            size={16}
                                            className="text-gray-400 group-hover/product:text-blue-600 transition-colors"
                                        />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PromotionCard;