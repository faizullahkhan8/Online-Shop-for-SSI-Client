import { useState, useEffect } from "react";
import { useAddReview, useGetProductReviews } from "../../api/hooks/review.api.js";
import StarRating from "../UI/StarRating.jsx";
import { MessageSquare, User, Calendar, Loader2 } from "lucide-react";

const ProductReviews = ({ productId }) => {
    const { getReviews, reviews, loading: reviewsLoading } = useGetProductReviews();
    const { addReview, loading: addLoading } = useAddReview();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    useEffect(() => {
        if (productId) {
            getReviews(productId);
        }
    }, [productId, getReviews]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            return;
        }
        const res = await addReview({ productId, rating, comment });
        if (res?.success) {
            setRating(0);
            setComment("");
            getReviews(productId);
        }
    };

    return (
        <div className="space-y-8 py-8 border-t border-gray-200">
            {/* Header */}
            <header className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-lg text-blue-600">
                    <MessageSquare size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">
                        Customer Reviews
                    </h3>
                    <p className="text-sm text-gray-500">
                        {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Review Form */}
                <div className="lg:col-span-5">
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 sticky top-24">
                        <h4 className="text-base font-semibold text-gray-900 mb-5">
                            Write a Review
                        </h4>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Your Rating
                                </label>
                                <StarRating rating={rating} setRating={setRating} size={24} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Your Review
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share your experience with this product..."
                                    className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-none"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={addLoading || rating === 0}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {addLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Review"
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Review List */}
                <div className="lg:col-span-7 space-y-4">
                    {reviewsLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white border border-gray-200 rounded-lg">
                            <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
                            <p className="text-sm text-gray-500">Loading reviews...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
                            <MessageSquare className="text-gray-300 mb-3" size={40} />
                            <p className="text-sm text-gray-500 text-center">
                                No reviews yet. Be the first to share your experience!
                            </p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div
                                key={review._id}
                                className="bg-white p-6 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-semibold text-gray-900">
                                                {review.name}
                                            </h5>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Calendar size={12} />
                                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <StarRating rating={review.rating} readonly size={14} />
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {review.comment}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductReviews;