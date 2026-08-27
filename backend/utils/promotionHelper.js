import { getLocalPromotionModel } from "../config/localDb.js";

/**
 * Calculates the current price of a product based on active promotions.
 * @param {string} productId - The ID of the product.
 * @param {number} basePrice - The original price of the product.
 * @returns {Promise<{price: number, promotion: object|null}>} - The effective price and the promotion details.
 */
export const getEffectivePrice = async (productId, basePrice) => {
    const PromotionModel = getLocalPromotionModel();
    if (!PromotionModel) return { price: basePrice, promotion: null };

    const now = new Date();
    // Find an active promotion that contains this product
    const activePromotion = await PromotionModel.findOne({
        products: productId,
        startTime: { $lte: now },
        endTime: { $gte: now },
    });

    if (!activePromotion) {
        return { price: basePrice, promotion: null };
    }

    let effectivePrice = basePrice;
    if (activePromotion.discountType === "PERCENTAGE") {
        effectivePrice = basePrice - (basePrice * activePromotion.discountValue) / 100;
    } else if (activePromotion.discountType === "FIXED_AMOUNT") {
        effectivePrice = basePrice - activePromotion.discountValue;
    }

    // Ensure price doesn't go below zero
    effectivePrice = Math.max(0, effectivePrice);

    return {
        price: effectivePrice,
        promotion: {
            id: activePromotion._id,
            title: activePromotion.title,
            type: activePromotion.type,
            discountType: activePromotion.discountType,
            discountValue: activePromotion.discountValue,
        },
    };
};
