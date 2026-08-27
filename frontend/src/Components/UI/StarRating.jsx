import { Star, StarHalf } from "lucide-react";

const StarRating = ({
    rating = 0,
    setRating,
    readonly = false,
    size = 18,
    activeColor = "text-yellow-400",
    inactiveColor = "text-slate-300",
}) => {
    const handleRating = (index) => {
        if (!readonly && setRating) {
            setRating(index);
        }
    };

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((index) => {
                const isFull = rating >= index;
                const isHalf = rating >= index - 0.5 && rating < index;

                return (
                    <div
                        key={index}
                        onClick={() => handleRating(index)}
                        className={`${!readonly ? "cursor-pointer transition-transform hover:scale-110" : ""}`}
                    >
                        {isFull ? (
                            <Star
                                size={size}
                                fill="currentColor"
                                className={activeColor}
                            />
                        ) : isHalf ? (
                            <StarHalf
                                size={size}
                                fill="currentColor"
                                className={activeColor}
                            />
                        ) : (
                            <Star size={size} className={inactiveColor} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default StarRating;
