import expressAsyncHandler from "express-async-handler";
import { getLocalReviewModel, getLocalProductModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
export const addReview = expressAsyncHandler(async (req, res, next) => {
    const { rating, comment, productId } = req.body;
    const Product = getLocalProductModel();
    const Review = getLocalReviewModel();

    if (!Product || !Review) {
        return next(new ErrorResponse("Database models not found", 500));
    }

    const product = await Product.findById(productId);

    if (product) {
        const alreadyReviewed = await Review.findOne({
            user: req.user._id,
            product: productId,
        });

        if (alreadyReviewed) {
            return next(new ErrorResponse("Product already reviewed", 400));
        }

        const review = await Review.create({
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
            product: productId,
        });

        const reviews = await Review.find({ product: productId });

        product.numReviews = reviews.length;
        product.rating =
            reviews.reduce((acc, item) => item.rating + acc, 0) /
            reviews.length;

        await product.save();
        res.status(201).json({ success: true, message: "Review added", review });
    } else {
        return next(new ErrorResponse("Product not found", 404));
    }
});

// @desc    Get product reviews
// @route   GET /api/reviews/:productId
// @access  Public
export const getProductReviews = expressAsyncHandler(async (req, res, next) => {
    const Review = getLocalReviewModel();
    if (!Review) {
        return next(new ErrorResponse("Review model not found", 500));
    }

    const reviews = await Review.find({ product: req.params.productId }).sort({
        createdAt: -1,
    });

    res.status(200).json({ success: true, reviews });
});
