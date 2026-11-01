import { getLocalOrderModel, getLocalProductModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { businessModels, prepareBusinessRecords, recordEvent, recordMovement } from "./businessRecords.js";

const revision = product => product.revision || 0;
export async function editCatalog(id, data, actor) {
    const Product = getLocalProductModel();
    await prepareBusinessRecords();
    return Product.db.transaction(async session => {
        const product = await Product.findOne({ _id: id, isArchived: { $ne: true } }).session(session);
        if (!product) throw new ErrorResponse("Product not found", 404);
        if (data.revision !== undefined && Number(data.revision) !== revision(product)) throw new ErrorResponse("Product changed. Reload before saving", 409);
        if (data.stock !== undefined && Number(data.stock) !== product.stock) throw new ErrorResponse("Stock changed or requires an adjustment. Reload and use Adjust stock", 409);
        const oldVariants = new Map(product.variants.map(variant => [String(variant._id), variant]));
        if (Array.isArray(data.variants)) {
            const retained = new Set(data.variants.filter(v => v._id).map(v => String(v._id)));
            const removed = product.variants.filter(v => !retained.has(String(v._id))).map(v => v._id);
            if (removed.length && await getLocalOrderModel().exists({ items: { $elemMatch: { product: product._id, variantId: { $in: removed } } } }).session(session)) throw new ErrorResponse("An ordered variant cannot be removed. Mark it inactive instead", 409);
            for (const variant of data.variants) {
                const old = variant._id && oldVariants.get(String(variant._id));
                if (variant._id && !old) throw new ErrorResponse("Unknown variant. Reload the product", 409);
                if (old && variant.stock !== undefined && Number(variant.stock) !== old.stock) throw new ErrorResponse("Variant stock changed or requires an adjustment. Reload and use Adjust stock", 409);
                if (old) variant.stock = old.stock;
            }
        }
        const allowed = ["name", "slug", "productType", "vendor", "price", "minPrice", "maxPrice", "description", "details", "badges", "category", "lowStock", "images", "image", "imagekitFileId", "variants"];
        for (const field of allowed) if (data[field] !== undefined) product.set(field, data[field]);
        const active = product.variants.filter(v => v.active !== false);
        product.hasVariants = active.length > 0;
        if (active.length) {
            product.price = Math.min(...active.map(v => v.price));
            const total = active.reduce((sum, v) => sum + v.stock, 0);
            const shared = oldVariants.size > 0 && [...oldVariants.values()].every(v => v.stock === 0) && product.stock > 0;
            if (shared && total > 0) throw new ErrorResponse("Adjust shared inventory to zero before introducing variant balances", 409);
            if (!shared) product.stock = total;
        }
        if (product.variants.length && !active.length) product.stock = 0;
        product.revision = revision(product) + 1;
        await product.save({ session });
        for (const variant of product.variants) if (!oldVariants.has(String(variant._id)) && variant.stock) await recordMovement(session, { key: `variant-opening:${variant._id}`, product: product._id, variantId: variant._id, delta: variant.stock, balance: variant.stock, actor: actor._id, reason: "New variant opening balance", sourceType: "catalog", sourceId: String(product._id) });
        await recordEvent(session, { key: `catalog:${id}:${product.revision}`, aggregate: "product", recordId: product._id, actor: actor._id, action: "catalog_edited", details: { revision: product.revision, fields: allowed.filter(field => data[field] !== undefined) } });
        return product;
    });
}

export async function archiveCatalog(id, actor, archived = true) {
    const Product = getLocalProductModel();
    await prepareBusinessRecords();
    return Product.db.transaction(async session => {
        const product = await Product.findById(id).session(session);
        if (!product) throw new ErrorResponse("Product not found", 404);
        if (Boolean(product.isArchived) === archived) return product;
        product.isArchived = archived; product.revision = revision(product) + 1;
        await product.save({ session });
        await recordEvent(session, { key: `catalog:${id}:${product.revision}`, aggregate: "product", recordId: product._id, action: archived ? "archived" : "restored", actor: actor._id });
        return product;
    });
}

export async function adjustInventory(id, actor, data, identity) {
    const { delta, reason, variantId, expectedRevision } = data;
    if (variantId && !/^[a-f0-9]{24}$/i.test(variantId)) throw new ErrorResponse("Invalid variant ID", 400);
    if (!Number.isSafeInteger(delta) || delta === 0 || typeof reason !== "string" || !reason.trim() || reason.length > 1000 || !Number.isSafeInteger(expectedRevision)) throw new ErrorResponse("Provide an integer stock change, reason and current product revision", 400);
    const Product = getLocalProductModel();
    await prepareBusinessRecords();
    const key = `adjust:${identity.checkoutKey}`;
    try { return await Product.db.transaction(async session => {
        const existing = await businessModels().Movement.findOne({ key }).session(session);
        if (existing) {
            if (existing.requestHash !== identity.checkoutHash || String(existing.product) !== id) throw new ErrorResponse("Adjustment key already used for another request", 409);
            return { movement: existing, product: await Product.findById(id).session(session) };
        }
        const product = await Product.findOne({ _id: id, isArchived: { $ne: true } }).session(session);
        if (!product) throw new ErrorResponse("Product not found", 404);
        if (revision(product) !== expectedRevision) throw new ErrorResponse("Inventory changed. Reload before adjusting", 409);
        const variant = variantId ? product.variants.id(variantId) : null;
        if (variantId && !variant) throw new ErrorResponse("Variant not found", 400);
        const shared = product.variants.length > 0 && product.variants.every(v => v.stock === 0) && product.stock > 0;
        if (shared && variant) throw new ErrorResponse("Adjust the shared balance before assigning variant stock", 409);
        if (!variant && product.variants.some(v => v.active !== false) && !shared) throw new ErrorResponse("Choose a variant to adjust", 400);
        const balance = (variant ? variant.stock : product.stock) + delta;
        if (!Number.isSafeInteger(balance) || balance < 0) throw new ErrorResponse("Adjustment would create invalid stock", 409);
        if (variant) {
            variant.stock = balance;
            product.stock = product.variants.filter(v => v.active !== false).reduce((sum, v) => sum + v.stock, 0);
        } else product.stock = balance;
        product.revision = revision(product) + 1;
        await product.save({ session });
        await recordMovement(session, { key, requestHash: identity.checkoutHash, product: product._id, variantId: variant?._id, delta, balance, reason: reason.trim(), actor: actor._id, sourceType: "adjustment", sourceId: String(product._id) });
        return { movement: await businessModels().Movement.findOne({ key }).session(session), product };
    }); } catch (error) {
        if (error.code !== 11000) throw error;
        const movement = await businessModels().Movement.findOne({ key });
        if (!movement || movement.requestHash !== identity.checkoutHash || String(movement.product) !== id) throw new ErrorResponse("Adjustment key conflict", 409);
        return { movement, product: await Product.findById(id) };
    }
}
