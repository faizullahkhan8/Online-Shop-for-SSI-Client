import expressAsyncHandler from "express-async-handler";
import {
    getLocalProductModel,
    getLocalCategoryModel,
    getLocalReviewModel,
    getLocalPromotionModel,
} from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { getEffectivePrice } from "../utils/promotionHelper.js";
import { deleteImageKitFile } from "../utils/DeleteFileImageKit.js";

export const createProduct = expressAsyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();
    if (!ProductModel)
        return next(new ErrorResponse("Product model not found", 500));

    let data;
    try { data = JSON.parse(req.body?.data); }
    catch { return next(new ErrorResponse("Invalid product data format", 400)); }
    if (!data || typeof data !== "object" || Array.isArray(data)) return next(new ErrorResponse("Invalid product data format", 400));
    const { name, slug, productType, vendor, price, minPrice, maxPrice, description, details, badges, category, stock, lowStock } = data;

    if (typeof name !== "string" || !name.trim() || !category || [price, stock, lowStock].some(value => value === undefined || value === null || value === ""))
        return next(new ErrorResponse("All fields are required except description", 400));

    let finalSlug = slug;
    if (!finalSlug) {
        finalSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const isProductExist = await ProductModel.findOne({ name });
    if (isProductExist)
        return next(new ErrorResponse("Product already exists", 400));

    if (!req.uploadedImages || req.uploadedImages.length === 0) {
        return res.status(400).json({
            message: "Image upload failed. At least one product image is required.",
        });
    }

    const product = await ProductModel.create({
        name,
        slug: finalSlug,
        productType,
        vendor,
        price,
        minPrice,
        maxPrice,
        description,
        details: details || [],
        badges: badges || [],
        category,
        stock,
        lowStock,
        image: req.uploadedImages[0]?.filePath || "",
        imagekitFileId: req.uploadedImages[0]?.fileId || "",
        images: req.uploadedImages,
    });

    return res.status(201).json({
        success: true,
        message: "Product created successfully",
        product,
    });
});

export const getAllProducts = expressAsyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();
    if (!ProductModel)
        return next(new ErrorResponse("Product model not found", 500));

    const {
        category,
        minPrice,
        maxPrice,
        search,
        productType,
        vendor,
        page = 1,
        limit = 9,
        excludeActivePromotions,
        currentPromotionId,
    } = req.query;

    let query = {};

    if (category) {
        // New links use category IDs; old bookmarks may contain names or legacy labels.
        const Category = getLocalCategoryModel();
        const aliases = {
            baby: ["baby", "baby care", "baby & mother care"],
            personal: ["personal", "personal care"],
            nutrition: ["nutrition", "nutrition & supplements", "vitamins and supplements"],
            beverages: ["beverages", "foods & beverages"],
            devices: ["devices", "devices & appliances"],
            otc: ["otc", "otc & health needs"],
        };
        const key = String(category).trim().toLowerCase();
        const categories = await Category.find({}).select("name parentId").lean();
        const names = aliases[key] || [key];
        const ids = new Set(categories.filter(c => String(c._id) === key || names.includes(c.name.toLowerCase())).map(c => String(c._id)));
        // Selecting a parent includes products assigned to its descendants.
        let size;
        do {
            size = ids.size;
            categories.forEach(c => { if (ids.has(String(c.parentId))) ids.add(String(c._id)); });
        } while (ids.size !== size);
        query.category = { $in: [...ids] };
    }

    if (productType) {
        query.productType = productType;
    }

    if (vendor) {
        query.vendor = vendor;
    }

    if (search) {
        query.name = { $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Exclude products already in active promotions
    if (excludeActivePromotions === "true") {
        const PromotionModel = getLocalPromotionModel();
        if (PromotionModel) {
            const promotionQuery = {
                status: { $in: ["ACTIVE", "SCHEDULED"] },
            };

            if (currentPromotionId) {
                promotionQuery._id = { $ne: currentPromotionId };
            }

            const activePromotions =
                await PromotionModel.find(promotionQuery).select("products");

            const usedProductIds = activePromotions.reduce((acc, promo) => {
                return acc.concat(promo.products);
            }, []);

            if (usedProductIds.length > 0) {
                // Determine if we need to merge with existing _id query (unlikely here but safe)
                if (query._id) {
                    query._id.$nin = [
                        ...(query._id.$nin || []),
                        ...usedProductIds,
                    ];
                } else {
                    query._id = { $nin: usedProductIds };
                }
            }
        }
    }

    if (!Number.isSafeInteger(Number(page)) || Number(page) < 1 || !Number.isSafeInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 1000)
        return next(new ErrorResponse("Page must be positive and limit must be between 1 and 1000", 400));
    const skip = (Number(page) - 1) * Number(limit);

    const products = await ProductModel.find(query)
        .populate("category", "name")
        .populate("vendor", "name image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const totalProducts = await ProductModel.countDocuments(query);

    const Review = getLocalReviewModel();
    const reviewStats = Review && products.length ? await Review.aggregate([
        { $match: { product: { $in: products.map(product => product._id) } } },
        { $group: { _id: "$product", averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
    ]) : [];
    const ratings = new Map(reviewStats.map(stats => [String(stats._id), stats]));
    // Enrich products with promotional pricing
    const productsWithPromos = await Promise.all(
        products.map(async (product) => {
            const { price: effectivePrice, promotion } =
                await getEffectivePrice(product._id, product.price);
            return {
                ...product.toObject(),
                id: product._id,
                averageRating: ratings.get(String(product._id))?.averageRating || 0,
                reviewCount: ratings.get(String(product._id))?.reviewCount || 0,
                effectivePrice,
                promotion,
            };
        }),
    );

    return res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        products: productsWithPromos,
        totalPages: Math.ceil(totalProducts / Number(limit)),
        currentPage: Number(page),
        totalProducts,
    });
});

export const getProductById = expressAsyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();
    if (!ProductModel)
        return next(new ErrorResponse("Product model not found", 500));

    const { id } = req.params;

    const product = await ProductModel.findById(id)
        .populate("category")
        .populate("vendor", "name description image");
    if (!product) return next(new ErrorResponse("Product not found", 404));

    const { price: effectivePrice, promotion } = await getEffectivePrice(
        product._id,
        product.price,
    );

    return res.status(200).json({
        success: true,
        message: "Product fetched successfully",
        product: {
            ...product.toObject(),
            id: product._id,
            effectivePrice,
            promotion,
        },
    });
});

export const updateProduct = expressAsyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();

    if (!ProductModel)
        return next(new ErrorResponse("Product model not found", 500));

    const { id } = req.params;

    const product = await ProductModel.findById(id);
    if (!product) {
        return next(new ErrorResponse("Product not found", 404));
    }

    let updateData;
    try {
        updateData = JSON.parse(req.body.data);
    } catch (error) {
        return next(new ErrorResponse("Invalid product data format", 400));
    }

    if (!updateData || typeof updateData !== "object" || Array.isArray(updateData)) return next(new ErrorResponse("Invalid product data format", 400));
    const editable = ["name", "slug", "productType", "vendor", "price", "minPrice", "maxPrice", "description", "details", "badges", "category", "stock", "lowStock", "images", "image", "imagekitFileId"];
    updateData = Object.fromEntries(Object.entries(updateData).filter(([key]) => editable.includes(key)));
    if (updateData.images !== undefined && !Array.isArray(updateData.images)) return next(new ErrorResponse("Images must be an array", 400));
    if (req.uploadedImages && req.uploadedImages.length > 0) {
        if (!updateData.images) updateData.images = [];
        // Optional: you could delete removed images from ImageKit here by comparing product.images and updateData.images
        updateData.images.push(...req.uploadedImages);
        
        // Backward compatibility
        updateData.imagekitFileId = updateData.images[0]?.fileId || "";
        updateData.image = updateData.images[0]?.filePath || "";
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
    );

    return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product: updatedProduct,
    });
});

export const deleteProduct = expressAsyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();

    if (!ProductModel)
        return next(new ErrorResponse("Product model not found", 500));

    const { id } = req.params;

    const product = await ProductModel.findById(id);
    if (!product) {
        return next(new ErrorResponse("Product not found", 404));
    }

    try {
        if (product.imagekitFileId) {
            await deleteImageKitFile(product.imagekitFileId);
        }
    } catch (err) {
        return next(
            new ErrorResponse("Failed to delete old image from ImageKit", 500),
        );
    }

    await product.deleteOne();

    return res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        product,
    });
});
