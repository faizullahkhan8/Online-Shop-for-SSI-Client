import asyncHandler from "express-async-handler";
import { getLocalCategoryModel, getLocalProductModel, getLocalVendorModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";

export const validateProductInput = asyncHandler(async (req, res, next) => {
    let data;
    try { data = JSON.parse(req.body?.data); }
    catch { throw new ErrorResponse("Invalid product data format", 400); }
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new ErrorResponse("Invalid product data format", 400);
    for (const field of ["minPrice", "maxPrice", "vendor"]) if (data[field] === "") data[field] = null;
    const Product = getLocalProductModel();
    const current = req.params.id ? await Product.findById(req.params.id) : null;
    if (req.params.id && !current) throw new ErrorResponse("Product not found", 404);
    const merged = { ...(current?.toObject() || {}), ...data };
    if (data.variants !== undefined && !Array.isArray(data.variants)) throw new ErrorResponse("Variants must be an array", 400);
    if (Array.isArray(data.variants)) {
        for (const variant of merged.variants) {
            if (!variant || typeof variant.name !== "string" || !variant.name.trim()) throw new ErrorResponse("Variant name is required", 400);
            if (variant.imageIndices !== undefined) {
                const imageCount = (Array.isArray(data.images) ? data.images.length : current?.images?.length || 0) + (req.files?.length || 0);
                if (!Array.isArray(variant.imageIndices) || new Set(variant.imageIndices).size !== variant.imageIndices.length ||
                    variant.imageIndices.some(index => !Number.isSafeInteger(index) || index < 0 || index >= imageCount)) {
                    throw new ErrorResponse("Variant images must be unique valid product image numbers", 400);
                }
                variant.imageIndex = variant.imageIndices[0] ?? 0;
            }
            for (const field of ["price", "stock", "lowStock", "imageIndex"]) {
                const value = variant[field] ?? (field === "lowStock" ? 5 : field === "price" ? NaN : 0);
                if (!["number", "string"].includes(typeof value) || value === "" || !Number.isFinite(Number(value)) || Number(value) < 0 || (field !== "price" && !Number.isSafeInteger(Number(value)))) throw new ErrorResponse(`Invalid variant ${field}`, 400);
            }
        }
        const active = merged.variants.filter(variant => variant.active !== false);
        merged.hasVariants = active.length > 0;
        if (active.length) {
            merged.price = Math.min(...active.map(variant => Number(variant.price)));
            merged.stock = active.reduce((total, variant) => total + Number(variant.stock || 0), 0);
        }
        Object.assign(data, { hasVariants: merged.hasVariants, price: merged.price, ...(!current ? { stock: merged.stock } : {}) });
    }
    req.body.data = JSON.stringify(data);
    for (const field of ["price", "stock", "lowStock", "minPrice", "maxPrice"]) {
        const value = merged[field];
        if (value == null && ["minPrice", "maxPrice"].includes(field)) continue;
        if (!["string", "number"].includes(typeof value) || value === "" || !Number.isFinite(Number(value)) || Number(value) < 0 ||
            (["stock", "lowStock"].includes(field) && !Number.isSafeInteger(Number(value))))
            throw new ErrorResponse(`${field} must be a valid non-negative ${["stock", "lowStock"].includes(field) ? "integer" : "amount"}`, 400);
    }
    if (merged.minPrice != null && merged.maxPrice != null && Number(merged.minPrice) > Number(merged.maxPrice))
        throw new ErrorResponse("Minimum price cannot exceed maximum price", 400);
    if (typeof merged.name !== "string" || !merged.name.trim()) throw new ErrorResponse("Product name is required", 400);
    if (!await getLocalCategoryModel().exists({ _id: merged.category })) throw new ErrorResponse("Category not found", 400);
    if (merged.vendor && !await getLocalVendorModel().exists({ _id: merged.vendor })) throw new ErrorResponse("Vendor not found", 400);
    // Schema validation runs before either optional processing or external storage.
    await new Product(merged).validate();
    next();
});
