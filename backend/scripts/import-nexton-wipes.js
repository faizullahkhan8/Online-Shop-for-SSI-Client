import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import imagekit from "../config/imagekit.js";
import {
    connectToDB,
    getLocalCategoryModel,
    getLocalProductModel,
    getLocalVendorModel,
} from "../config/localDb.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const assetsDir = "/Users/bakhtzada/Desktop/Zada Pharmacy/product-assets/nexton-wipes";
const imageFiles = [
    "nexton-baby-wipes-aloe-vera-green-64.jpg",
    "nexton-baby-wipes-fragrance-free-blue-64.jpg",
    "nexton-baby-wipes-extra-sensitive-pink-64.jpg",
];

const sourcePages = [
    "https://nexton.com.pk/products/nexton-new-improved-baby-wipes-alovera-64-pcs-pack",
    "https://nexton.com.pk/products/nexton-new-improved-baby-wipes-fragnance-free-64-pcs-pack",
    "https://nexton.com.pk/products/nexton-baby-wipes-64-pcs-pack",
];

const imageSources = [
    "https://nexton.com.pk/cdn/shop/files/64_aloe_vera_wipes.jpg?v=1736584671&width=1000",
    "https://nexton.com.pk/cdn/shop/files/64_fragrance_free_wipes.jpg?v=1736584721&width=1000",
    "https://nexton.com.pk/cdn/shop/files/64_mild_wipes.jpg?v=1736584709&width=1000",
];

const uploadImage = async (fileName) => {
    const file = await fs.readFile(path.join(assetsDir, fileName));
    const result = await imagekit.files.upload({
        file: file.toString("base64"),
        fileName,
        folder: "/products",
        useUniqueFileName: true,
    });
    return {
        fileId: result.fileId,
        url: result.url,
        name: result.name,
        filePath: result.filePath,
    };
};

const run = async () => {
    await connectToDB();
    const Product = getLocalProductModel();
    const Category = getLocalCategoryModel();
    const Vendor = getLocalVendorModel();

    const slug = "nexton-baby-wipes-64-wipes";
    const duplicate = await Product.findOne({
        $or: [{ slug }, { name: "Nexton Baby Wipes – 64 Wipes" }],
    });
    if (duplicate) {
        console.log(JSON.stringify({ status: "exists", id: duplicate._id, slug: duplicate.slug }));
        process.exit(0);
    }

    const category = await Category.findOne({ name: "baby & mother care" });
    if (!category) throw new Error("Category 'baby & mother care' was not found");
    const vendor = await Vendor.findOne({ name: "Zada Pharmacy" });
    if (!vendor) throw new Error("Vendor 'Zada Pharmacy' was not found");

    const images = [];
    try {
        for (const fileName of imageFiles) images.push(await uploadImage(fileName));

        const product = await Product.create({
            name: "Nexton Baby Wipes – 64 Wipes",
            slug,
            brand: "Nexton",
            vendor: vendor._id,
            productType: "Baby Wipes",
            category: category._id,
            packSize: "64 wipes",
            price: 599,
            stock: 0,
            lowStock: 5,
            hasVariants: true,
            variants: [
                { name: "Aloe Vera", color: "Green", sku: "NEXTON-WIPES-64-GREEN", price: 599, stock: 0, lowStock: 5, imageIndex: 0, active: true },
                { name: "Fragrance Free – Sensitive Skin", color: "Blue", sku: "NEXTON-WIPES-64-BLUE", price: 599, stock: 0, lowStock: 5, imageIndex: 1, active: true },
                { name: "Extra Sensitive", color: "Pink", sku: "NEXTON-WIPES-64-PINK", price: 599, stock: 0, lowStock: 5, imageIndex: 2, active: true },
            ],
            shortDescription: "Soft baby wipes in three care variants, supplied in a convenient 64-wipe pack.",
            description: "Nexton Baby Wipes are designed for gentle everyday cleansing. Choose Aloe Vera, Fragrance Free for sensitive skin, or Extra Sensitive according to your preference. Each pack contains 64 wipes.",
            details: [
                {
                    title: "Key Features",
                    contentHTML: "<ul><li>64 wipes per pack</li><li>Extra-long, thick and ultra-soft fabric</li><li>Designed for gentle everyday cleansing</li><li>Three clearly identified care variants</li></ul>",
                    contentJSON: "",
                },
                {
                    title: "Variant Information",
                    contentHTML: "<p><strong>Aloe Vera (Green):</strong> Enriched with aloe vera and designed to hydrate and soothe.</p><p><strong>Fragrance Free – Sensitive Skin (Blue):</strong> Fragrance-free option designed for extra-sensitive skin.</p><p><strong>Extra Sensitive (Pink):</strong> Soft wipes with added leaf extracts, designed for extra-sensitive care.</p>",
                    contentJSON: "",
                },
                {
                    title: "How to Use",
                    contentHTML: "<p>Open the resealable pack, remove one wipe and gently cleanse the required area. Reseal the pack after use to help keep the remaining wipes moist.</p>",
                    contentJSON: "",
                },
                {
                    title: "Warnings & Storage",
                    contentHTML: "<p>For external use only. Avoid direct contact with eyes. Keep out of reach of children. Store in a cool, dry place and keep the pack sealed between uses.</p>",
                    contentJSON: "",
                },
            ],
            tags: ["Nexton", "baby wipes", "mother and baby care", "sensitive skin", "aloe vera", "fragrance free"],
            badges: [],
            seoTitle: "Nexton Baby Wipes 64 Wipes – Aloe Vera, Sensitive & Extra Sensitive",
            metaDescription: "Buy Nexton Baby Wipes 64 pack in Aloe Vera Green, Fragrance Free Sensitive Skin Blue, or Extra Sensitive Pink. Each variant is Rs 599.",
            searchKeywords: ["Nexton baby wipes", "Nexton wipes 64", "aloe vera baby wipes", "fragrance free baby wipes", "extra sensitive baby wipes"],
            researchSources: sourcePages,
            imageSources,
            image: images[0].filePath,
            imagekitFileId: images[0].fileId,
            images,
        });

        console.log(JSON.stringify({
            status: "created",
            id: product._id,
            slug: product.slug,
            variants: product.variants.map((variant) => variant.name),
            images: product.images.length,
        }));
    } catch (error) {
        await Promise.allSettled(images.map((image) => imagekit.files.delete(image.fileId)));
        throw error;
    }
};

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
