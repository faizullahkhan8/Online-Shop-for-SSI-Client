import { searchCatalog } from "../services/catalogSearch.js";
import { prepareBusinessRecords, recordMovement, recordEvent } from "../services/businessRecords.js";
import { editCatalog, archiveCatalog, adjustInventory } from "../services/catalogLifecycle.js";
import { checkoutKey } from "../utils/checkoutKey.js";
import expressAsyncHandler from "express-async-handler";
import {
    getLocalProductModel,
    getLocalCategoryModel,
    getLocalReviewModel,
    getLocalPromotionModel,
} from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { getEffectivePrice } from "../utils/promotionHelper.js";

export const createProduct = expressAsyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();
    if (!ProductModel)
        return next(new ErrorResponse("Product model not found", 500));

    const data = JSON.parse(req.body.data);
    const { name, slug, productType, vendor, price, minPrice, maxPrice, description, details, badges, category, stock, lowStock, hasVariants, variants } = data;

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

    const product = new ProductModel({
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
        hasVariants,
        variants,
        image: req.uploadedImages[0]?.filePath || "",
        imagekitFileId: req.uploadedImages[0]?.fileId || "",
        images: req.uploadedImages,
    });

    await prepareBusinessRecords();
    await ProductModel.db.transaction(async session => {
        await product.save({ session });
        const variants = product.variants.filter(variant => variant.stock > 0);
        if (variants.length) {
            for (const variant of variants) await recordMovement(session, { key: `opening:${product._id}:${variant._id}`, product: product._id, variantId: variant._id, delta: variant.stock, balance: variant.stock, actor: req.user._id, reason: "Opening balance", sourceType: "catalog", sourceId: String(product._id) });
        } else if (product.stock) await recordMovement(session, { key: `opening:${product._id}`, product: product._id, delta: product.stock, balance: product.stock, actor: req.user._id, reason: "Opening balance", sourceType: "catalog", sourceId: String(product._id) });
        await recordEvent(session, { key: `catalog:${product._id}:created`, aggregate: "product", recordId: product._id, action: "created", actor: req.user._id });
    });

    return res.status(201).json({
        success: true,
        message: "Product created successfully",
        product,
    });
});

export const getAllProducts = expressAsyncHandler(async (req, res) => {
    res.json(await searchCatalog(req.query, { archived: req.archivedCatalog === true }));
});

// A single indexed lookup for the editor; no catalog promotions or populated documents.
export const getProductForEdit = expressAsyncHandler(async (req, res, next) => {
    const { id } = req.params;
    res.set("Cache-Control", "no-store");
    if (!/^[a-f0-9]{24}$/i.test(id)) return next(new ErrorResponse("Invalid product ID", 400));
    const Product = getLocalProductModel();
    if (!Product) return next(new ErrorResponse("Product model not found", 500));
    const product = await Product.findOne({ _id: id, isArchived: { $ne: true } })
        .select("_id revision name slug productType vendor price minPrice maxPrice description details category stock lowStock hasVariants variants badges image imagekitFileId images")
        .lean();
    if (!product) return next(new ErrorResponse("Product not found or archived. Restore archived products before editing.", 404));
    return res.json({ success: true, product });
});

export const getProductById = expressAsyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();
    if (!ProductModel)
        return next(new ErrorResponse("Product model not found", 500));

    const { id } = req.params;

    const product = await ProductModel.findOne({ _id: id, isArchived: { $ne: true } })
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
    const editable = ["variants", "hasVariants", "name", "slug", "productType", "vendor", "price", "minPrice", "maxPrice", "description", "details", "badges", "category", "stock", "lowStock", "images", "image", "imagekitFileId"];
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

    const updatedProduct = await editCatalog(id, { ...updateData, revision: JSON.parse(req.body.data).revision }, req.user);

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

    const product = await archiveCatalog(id, req.user);
    return res.json({ success: true, message: "Product archived. Historical orders and stock are preserved", product });
});

export const restoreProduct = expressAsyncHandler(async (req, res) => {
    const product = await archiveCatalog(req.params.id, req.user, false);
    res.json({ success: true, product });
});
export const adjustProductStock = expressAsyncHandler(async (req, res) => {
    const result = await adjustInventory(req.params.id, req.user, req.body, checkoutKey(req));
    res.json({ success: true, ...result });
});
