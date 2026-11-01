import { Types } from "mongoose";
import { getLocalProductModel, getLocalCategoryModel, getLocalPromotionModel, getLocalReviewModel, getLocalVendorModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sorts = { newest: { createdAt: -1, _id: -1 }, relevance: { _relevance: -1, sold: -1, _id: -1 }, price_asc: { effectivePrice: 1, _id: 1 }, price_desc: { effectivePrice: -1, _id: 1 }, bestselling: { sold: -1, _id: -1 }, rating: { averageRating: -1, reviewCount: -1, _id: -1 } };
const scalar = (value, name, fallback = "") => {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || value.length > 250) throw new ErrorResponse(`Invalid ${name}`, 400);
    return value.trim();
};
const list = (value, name) => {
    if (value === undefined) return [];
    const values = Array.isArray(value) ? value : [value];
    if (values.length > 30) throw new ErrorResponse(`Too many ${name} values`, 400);
    return [...new Set(values.map(v => scalar(v, name)).filter(Boolean))];
};
const amount = (value, name) => {
    if (value === undefined || value === "") return null;
    const text = scalar(value, name);
    const number = Number(text);
    if (!text || !Number.isFinite(number) || number < 0 || number > 1e12) throw new ErrorResponse(`Invalid ${name}`, 400);
    return number;
};
export function parseCatalogQuery(query) {
    const page = Number(scalar(query.page, "page", "1"));
    const limit = Number(scalar(query.limit, "limit", "9"));
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 1000 || !Number.isSafeInteger((page - 1) * limit)) throw new ErrorResponse("Page must be positive and limit must be between 1 and 1000", 400);
    const minPrice = amount(query.minPrice, "minimum price"), maxPrice = amount(query.maxPrice, "maximum price");
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) throw new ErrorResponse("Minimum price cannot exceed maximum price", 400);
    const minRating = amount(query.minRating, "minimum rating");
    if (minRating !== null && minRating > 5) throw new ErrorResponse("Rating must be between 0 and 5", 400);
    const availability = scalar(query.availability, "availability");
    if (!["", "in_stock", "out_of_stock"].includes(availability)) throw new ErrorResponse("Invalid availability", 400);
    const search = scalar(query.search, "search");
    const sort = scalar(query.sort, "sort", search ? "relevance" : "newest");
    if (!Object.hasOwn(sorts, sort)) throw new ErrorResponse("Invalid product sorting", 400);
    const onSale = scalar(query.onSale, "offer filter", "false");
    if (!["true", "false"].includes(onSale)) throw new ErrorResponse("Invalid offer filter", 400);
    const vendors = list(query.vendor, "vendor");
    if (vendors.some(id => !/^[a-f0-9]{24}$/i.test(id))) throw new ErrorResponse("Invalid vendor ID", 400);
    return { page, limit, search, sort, minPrice, maxPrice, minRating, availability, onSale: onSale === "true", brands: list(query.brand, "brand"), vendors, categories: list(query.category, "category"), productType: scalar(query.productType, "product type"), facets: scalar(query.facets, "facets") === "true", exclude: scalar(query.excludeActivePromotions, "promotion exclusion") === "true", currentPromotionId: scalar(query.currentPromotionId, "promotion ID") };
}

const roundPrice = expression => ({ $divide: [{ $floor: { $add: [{ $multiply: [{ $add: [{ $max: [0, expression] }, Number.EPSILON] }, 100] }, 0.5] } }, 100] });
const promotedPrice = price => roundPrice({ $switch: { branches: [
    { case: { $eq: ["$_promotion.discountType", "PERCENTAGE"] }, then: { $subtract: [price, { $divide: [{ $multiply: [price, "$_promotion.discountValue"] }, 100] }] } },
    { case: { $eq: ["$_promotion.discountType", "FIXED_AMOUNT"] }, then: { $subtract: [price, "$_promotion.discountValue"] } },
], default: price } });
const aliases = { baby: ["baby", "baby care", "baby & mother care"], personal: ["personal", "personal care"], nutrition: ["nutrition", "nutrition & supplements", "vitamins and supplements"], beverages: ["beverages", "foods & beverages"], devices: ["devices", "devices & appliances"], otc: ["otc", "otc & health needs"] };
function categoryIds(tokens, categories) {
    const selected = new Set();
    for (const token of tokens) {
        const key = token.toLowerCase(), names = Object.hasOwn(aliases, key) ? aliases[key] : [key];
        categories.forEach(c => { if (String(c._id) === key || names.includes(c.name.toLowerCase())) selected.add(String(c._id)); });
    }
    let size;
    do { size = selected.size; categories.forEach(c => { if (selected.has(String(c.parentId))) selected.add(String(c._id)); }); } while (selected.size !== size);
    return [...selected].map(id => new Types.ObjectId(id));
}

export async function searchCatalog(query, { archived = false } = {}) {
    const f = parseCatalogQuery(query);
    const Product = getLocalProductModel(), Promotion = getLocalPromotionModel(), Review = getLocalReviewModel(), Vendor = getLocalVendorModel();
    const categories = await getLocalCategoryModel().find({}).select("name parentId isActive").lean();
    const base = archived ? { isArchived: true } : { isArchived: { $ne: true } };
    if (f.productType) base.productType = f.productType;
    const regex = escapeRegex(f.search);
    if (regex) base.$or = ["name", "brand", "variants.sku"].map(field => ({ [field]: { $regex: regex, $options: "i" } }));
    if (f.exclude) {
        const filter = { status: { $in: ["ACTIVE", "SCHEDULED"] } };
        if (f.currentPromotionId) {
            if (!/^[a-f0-9]{24}$/i.test(f.currentPromotionId)) throw new ErrorResponse("Invalid promotion ID", 400);
            filter._id = { $ne: new Types.ObjectId(f.currentPromotionId) };
        }
        const excluded = await Promotion.find(filter).select("products").lean();
        base._id = { $nin: excluded.flatMap(p => p.products) };
    }
    const now = new Date();
    const pipeline = [
        { $match: base },
        { $lookup: { from: Promotion.collection.name, let: { id: "$_id" }, pipeline: [{ $match: { $expr: { $and: [{ $in: ["$$id", "$products"] }, { $in: ["$status", ["ACTIVE", "SCHEDULED"]] }, { $lte: ["$startTime", now] }, { $gte: ["$endTime", now] }] } } }, { $sort: { _id: 1 } }, { $limit: 1 }], as: "_promotions" } },
        { $lookup: { from: Review.collection.name, let: { id: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$product", "$$id"] } } }, { $group: { _id: null, averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } }], as: "_reviews" } },
        { $set: { _promotion: { $arrayElemAt: ["$_promotions", 0] }, _active: { $filter: { input: { $ifNull: ["$variants", []] }, as: "v", cond: { $ne: ["$$v.active", false] } } }, averageRating: { $ifNull: [{ $arrayElemAt: ["$_reviews.averageRating", 0] }, 0] }, reviewCount: { $ifNull: [{ $arrayElemAt: ["$_reviews.reviewCount", 0] }, 0] } } },
        { $set: { _shared: { $and: [{ $eq: [{ $sum: "$_active.stock" }, 0] }, { $gt: ["$stock", 0] }] } } },
        { $set: { _offers: { $cond: [{ $gt: [{ $size: "$_active" }, 0] }, { $map: { input: "$_active", as: "v", in: { price: promotedPrice("$$v.price"), regularPrice: roundPrice("$$v.price"), stock: { $cond: ["$_shared", "$stock", { $min: ["$$v.stock", "$stock"] }] } } } }, [{ price: promotedPrice("$price"), regularPrice: roundPrice("$price"), stock: { $cond: [{ $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] }, 0, "$stock"] } }]] } } },
        { $set: { regularPrice: { $min: "$_offers.regularPrice" }, effectivePrice: { $min: "$_offers.price" }, effectiveMaxPrice: { $max: "$_offers.price" }, availableStock: { $max: "$_offers.stock" }, promotion: { $cond: [{ $gt: [{ $size: "$_promotions" }, 0] }, { id: "$_promotion._id", title: "$_promotion.title", type: "$_promotion.type", discountType: "$_promotion.discountType", discountValue: "$_promotion.discountValue" }, null] }, _relevance: regex ? { $add: [{ $cond: [{ $regexMatch: { input: "$name", regex: `^${regex}$`, options: "i" } }, 8, 0] }, { $cond: [{ $regexMatch: { input: "$name", regex: `^${regex}`, options: "i" } }, 4, 0] }, { $cond: [{ $regexMatch: { input: { $ifNull: ["$brand", ""] }, regex, options: "i" } }, 2, 0] }] } : 0 } },
    ];
    const filters = {};
    if (f.categories.length) filters.category = { category: { $in: categoryIds(f.categories, categories) } };
    if (f.brands.length) filters.brand = { brand: { $in: f.brands } };
    if (f.vendors.length) filters.vendor = { vendor: { $in: f.vendors.map(id => new Types.ObjectId(id)) } };
    if (f.minRating !== null) filters.rating = { averageRating: { $gte: f.minRating } };
    const offerConditions = [];
    if (f.minPrice !== null) offerConditions.push({ $gte: ["$$offer.price", f.minPrice] });
    if (f.maxPrice !== null) offerConditions.push({ $lte: ["$$offer.price", f.maxPrice] });
    if (f.availability === "in_stock") offerConditions.push({ $gt: ["$$offer.stock", 0] });
    if (f.onSale) offerConditions.push({ $lt: ["$$offer.price", "$$offer.regularPrice"] });
    if (offerConditions.length) filters.offers = { $expr: { $anyElementTrue: [{ $map: { input: "$_offers", as: "offer", in: { $and: offerConditions } } }] } };
    if (f.availability === "out_of_stock") filters.availability = { availableStock: { $lte: 0 } };
    const match = omit => ({ $match: { $and: [{}, ...Object.entries(filters).filter(([key]) => key !== omit).map(([, value]) => value)] } });
    const groups = {
        products: [match(), { $sort: sorts[f.sort] }, { $skip: (f.page - 1) * f.limit }, { $limit: f.limit }, { $unset: ["_promotions", "_promotion", "_reviews", "_active", "_shared", "_offers", "_relevance"] }],
        total: [match(), { $count: "count" }],
    };
    if (f.facets) {
        groups.brands = [match("brand"), { $match: { brand: { $type: "string", $nin: ["", null] } } }, { $group: { _id: "$brand", count: { $sum: 1 } } }, { $sort: { _id: 1 } }];
        groups.vendors = [match("vendor"), { $match: { vendor: { $type: "objectId" } } }, { $group: { _id: "$vendor", count: { $sum: 1 } } }, { $lookup: { from: Vendor.collection.name, localField: "_id", foreignField: "_id", as: "vendor" } }, { $unwind: "$vendor" }, { $project: { _id: 1, name: "$vendor.name", count: 1 } }, { $sort: { name: 1 } }];
        groups.categories = [match("category"), { $group: { _id: "$category", count: { $sum: 1 } } }];
        groups.priceRange = [match("offers"), { $unwind: "$_offers" }, { $group: { _id: null, min: { $min: "$_offers.price" }, max: { $max: "$_offers.price" } } }];
    }
    const [result] = await Product.aggregate([...pipeline, { $facet: groups }]);
    const totalProducts = result.total[0]?.count || 0;
    const products = await Product.populate(result.products, [{ path: "category", select: "name" }, { path: "vendor", select: "name image" }]);
    const response = { success: true, message: "Products fetched successfully", products: products.map(p => ({ ...p, id: p._id })), totalProducts, totalPages: Math.ceil(totalProducts / f.limit), currentPage: f.page };
    if (f.facets) {
        if (f.vendors.length) {
            const selectedVendors = await Vendor.find({ _id: { $in: f.vendors.map(id => new Types.ObjectId(id)) } }).select("name").lean();
            selectedVendors.forEach(v => { if (!result.vendors.some(option => String(option._id) === String(v._id))) result.vendors.push({ _id: v._id, name: v.name, count: 0 }); });
        }
        f.brands.forEach(brand => { if (!result.brands.some(option => option._id === brand)) result.brands.push({ _id: brand, count: 0 }); });
        const countMap = new Map(result.categories.map(c => [String(c._id), c.count]));
        response.facets = {
            brands: result.brands.map(b => ({ value: b._id, label: b._id, count: b.count })),
            vendors: result.vendors.map(v => ({ value: String(v._id), label: v.name, count: v.count })),
            categories: categories.filter(c => c.isActive !== false).map(c => {
                const ids = categoryIds([String(c._id)], categories);
                return { value: String(c._id), label: c.name, parentId: c.parentId ? String(c.parentId) : null, count: ids.reduce((sum, id) => sum + (countMap.get(String(id)) || 0), 0) };
            }).sort((a, b) => a.label.localeCompare(b.label)),
            priceRange: result.priceRange[0] ? { min: result.priceRange[0].min, max: result.priceRange[0].max } : null,
        };
    }
    return response;
}
