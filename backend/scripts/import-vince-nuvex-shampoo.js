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

const assetDir = "/Users/bakhtzada/Desktop/Zada Pharmacy/product-assets/vince-nuvex-shampoo";
const variants = [
    {
        name: "Deep Moisture",
        color: "White",
        sku: "VINCE-NUVEX-175-WHITE",
        file: "deep-moisture-white.webp",
        source: "https://vincecare.com/products/deep-moisture-shampoo",
        imageSource: "https://vincecare.com/cdn/shop/files/Deep_Moisture_Shampoo_b1622bfe-bdc6-4006-bf85-685b3c4f5c22_1200x.webp?v=1783584899",
    },
    {
        name: "Glossy Black",
        color: "Black",
        sku: "VINCE-NUVEX-175-BLACK",
        file: "glossy-black-black.webp",
        source: "https://vincecare.com/products/glossy-black-shampoo",
        imageSource: "https://vincecare.com/cdn/shop/files/Glossy_Black_Shampoo_28b2d839-d383-4ae9-9086-9294c93cff77_1200x.webp?v=1783584892",
    },
    {
        name: "Effortlessly Smooth",
        color: "Pink",
        sku: "VINCE-NUVEX-175-PINK",
        file: "effortlessly-smooth-pink.webp",
        source: "https://vincecare.com/products/effortlessly-smooth-shampoo",
        imageSource: "https://vincecare.com/cdn/shop/files/Effortlessly_Smooth_Shampoo_38e7e4e1-6cb6-4304-9d59-f39d953ddeb3_1200x.webp?v=1783584897",
    },
    {
        name: "Luxuriously Long",
        color: "Green",
        sku: "VINCE-NUVEX-175-GREEN",
        file: "luxuriously-long-green.webp",
        source: "https://vincecare.com/products/luxuriously-long-shampoo",
        imageSource: "https://vincecare.com/cdn/shop/files/Luxuriously_Long_Shampoo_bd0fad69-bfa4-45e4-a646-41c64a0966c6_1200x.webp?v=1783584901",
    },
    {
        name: "Ultimate Reviving",
        color: "Yellow",
        sku: "VINCE-NUVEX-175-YELLOW",
        file: "ultimate-reviving-yellow.webp",
        source: "https://vincecare.com/products/ultimate-reviving-shampoo",
        imageSource: "https://vincecare.com/cdn/shop/files/Ultimate_Reviving_Shampoo_881abd0c-5008-4714-8254-e164bc2e99ef_1200x.webp?v=1783584895",
    },
];

const upload = async (variant) => {
    const data = await fs.readFile(path.join(assetDir, variant.file));
    const result = await imagekit.files.upload({
        file: data.toString("base64"),
        fileName: variant.file,
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
    const slug = "vince-nuvex-shampoo-175ml";

    const duplicate = await Product.findOne({
        $or: [{ slug }, { name: "VINCÉ NUVEX Shampoo 175 ml" }],
    });
    if (duplicate) {
        console.log(JSON.stringify({ status: "exists", id: duplicate._id, slug: duplicate.slug }));
        process.exit(0);
    }

    const category = await Category.findOne({ name: "personal care" });
    if (!category) throw new Error("Category 'personal care' was not found");
    const vendor = await Vendor.findOne({ name: "Zada Pharmacy" });
    if (!vendor) throw new Error("Vendor 'Zada Pharmacy' was not found");

    const images = [];
    try {
        for (const variant of variants) images.push(await upload(variant));

        const product = await Product.create({
            name: "VINCÉ NUVEX Shampoo 175 ml",
            slug,
            brand: "VINCÉ",
            vendor: vendor._id,
            productType: "Shampoo",
            category: category._id,
            packSize: "175 ml",
            price: 410,
            stock: 50,
            lowStock: 5,
            hasVariants: true,
            variants: variants.map((variant, index) => ({
                name: variant.name,
                color: variant.color,
                sku: variant.sku,
                price: 410,
                stock: 10,
                lowStock: 5,
                imageIndex: index,
                active: true,
            })),
            shortDescription: "VINCÉ NUVEX shampoo in five specialised 175 ml variants for different hair-care needs.",
            description: "Choose from five VINCÉ NUVEX 175 ml shampoos: Deep Moisture, Glossy Black, Effortlessly Smooth, Luxuriously Long, and Ultimate Reviving. Each variant has its own formula and clearly matched pack colour.",
            details: [
                {
                    title: "Variant Guide",
                    contentHTML: "<ul><li><strong>Deep Moisture (White):</strong> Pro-vitamin B5 formula for hydration, softness and improved texture.</li><li><strong>Glossy Black (Black):</strong> Wheat-protein formula designed to nourish, condition and enhance shine.</li><li><strong>Effortlessly Smooth (Pink):</strong> Silk-protein formula designed to tame frizz and improve manageability.</li><li><strong>Luxuriously Long (Green):</strong> Vegetable-protein formula designed to strengthen hair and help reduce breakage.</li><li><strong>Ultimate Reviving (Yellow):</strong> Soy-protein formula designed for damaged hair and improved texture.</li></ul>",
                    contentJSON: "",
                },
                {
                    title: "How to Use",
                    contentHTML: "<p>Wet hair thoroughly with normal water. Apply a sufficient amount to the scalp and hair, massage gently to create a lather, then rinse thoroughly with fresh water.</p>",
                    contentJSON: "",
                },
                {
                    title: "Warnings & Storage",
                    contentHTML: "<p>For external use only. Avoid direct contact with the eye area. If contact occurs, rinse immediately with normal water. Keep out of reach of children and store at room temperature.</p>",
                    contentJSON: "",
                },
            ],
            tags: ["Vince", "VINCÉ", "NUVEX", "shampoo", "hair care", "175 ml"],
            badges: [],
            seoTitle: "VINCÉ NUVEX Shampoo 175 ml – Five Variants",
            metaDescription: "Shop VINCÉ NUVEX Shampoo 175 ml in Deep Moisture White, Glossy Black, Effortlessly Smooth Pink, Luxuriously Long Green and Ultimate Reviving Yellow for Rs 410.",
            searchKeywords: ["Vince Nuvex shampoo", "Nuvex shampoo 175ml", "Vince shampoo", "Deep Moisture shampoo", "Glossy Black shampoo", "Effortlessly Smooth shampoo", "Luxuriously Long shampoo", "Ultimate Reviving shampoo"],
            researchSources: [
                "https://vincecare.com/products/nuvex-shampoo-pack-of-5",
                ...variants.map((variant) => variant.source),
            ],
            imageSources: variants.map((variant) => variant.imageSource),
            image: images[0].filePath,
            imagekitFileId: images[0].fileId,
            images,
        });

        console.log(JSON.stringify({
            status: "created",
            id: product._id,
            slug: product.slug,
            stock: product.stock,
            variants: product.variants.map((variant) => ({
                name: variant.name,
                color: variant.color,
                price: variant.price,
                stock: variant.stock,
            })),
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
