import { getLocalOrderModel, getLocalProductModel } from "../config/localDb.js";
import { businessModels, prepareBusinessRecords, recordMovement, recordEvent } from "./businessRecords.js";

// Idempotent observations, NOT invented historical receipts, names or timestamps.
export async function migrateBusinessRecords({ apply = false } = {}) {
    await prepareBusinessRecords();
    const Order = getLocalOrderModel(), Product = getLocalProductModel();
    const summary = { mode: apply ? "apply" : "dry-run", orders: 0, products: 0, missingCatalogItems: 0, paymentsWithoutProvenance: 0 };
    for await (const row of Order.find({ businessMigrationVersion: { $ne: 1 } }).select("_id").cursor()) {
        const work = async session => {
            const order = await Order.findById(row._id).session(session);
            if (order.businessMigrationVersion === 1) return;
            summary.orders++;
            for (const line of order.items) {
                if (line.name) continue;
                const product = await Product.findById(line.product).session(session);
                if (!product) summary.missingCatalogItems++;
                line.name = product?.name || "Historical product (catalog unavailable)";
                line.sku = product?.variants.id(line.variantId)?.sku || "";
                line.packSize = product?.packSize || "";
                line.image = product?.image || "";
                line.snapshotSource = product ? "legacy_catalog" : "unavailable";
            }
            if (order.payment?.ispaid && (!order.payment.paidAt || !order.payment.recordedBy || !order.payment.reference)) {
                summary.paymentsWithoutProvenance++;
                order.legacyPaymentProvenanceUnknown = true;
            }
            if (apply) {
                order.businessMigrationVersion = 1;
                await order.save({ session, timestamps: false });
                await recordEvent(session, { key: `legacy-order:${order._id}`, aggregate: "order", recordId: order._id, action: "legacy_observation", details: { originalProductNameUnknown: order.items.some(line => line.snapshotSource !== "checkout"), originalPaymentProvenanceUnknown: order.legacyPaymentProvenanceUnknown === true } });
            }
        };
        if (apply) await Order.db.transaction(work); else await work(null);
    }
    for await (const row of Product.find({}).select("_id").cursor()) {
        const work = async session => {
            const product = await Product.findById(row._id).session(session);
            const key = `baseline:${product._id}`;
            if (await businessModels().Movement.exists({ key }).session(session)) return;
            summary.products++;
            if (apply) {
                await recordMovement(session, { key, product: product._id, delta: 0, balance: product.stock, reason: "Observed balance at migration; earlier receipts and adjustments unknown", sourceType: "baseline", sourceId: String(product._id) });
                for (const variant of product.variants) await recordMovement(session, { key: `${key}:${variant._id}`, product: product._id, variantId: variant._id, delta: 0, balance: variant.stock, reason: "Observed variant balance at migration", sourceType: "baseline", sourceId: String(product._id) });
                // Serialize against checkout/adjustment; it must not race the baseline capture.
                product.revision = (product.revision || 0) + 1;
                await product.save({ session, timestamps: false });
            }
        };
        if (apply) await Product.db.transaction(work); else await work(null);
    }
    return summary;
}
