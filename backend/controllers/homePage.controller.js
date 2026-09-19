import expressAsyncHandler from "express-async-handler";
import { getLocalHomePageModel, getLocalProductModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { DEFAULT_SECTIONS } from "../utils/defaultSections.js";

// @desc    Get homepage config
// @route   GET /api/homepage
// @access  Public
export const getHomePage = expressAsyncHandler(async (req, res, next) => {
    const HomePageModel = getLocalHomePageModel();
    const ProductModel = getLocalProductModel();
    if (!HomePageModel) return next(new ErrorResponse("HomePage model not found", 500));

    let doc = await HomePageModel.findOne({}).lean();

    // If no config exists yet, return the default config (don't save it yet)
    if (!doc) {
        return res.status(200).json({
            success: true,
            sections: DEFAULT_SECTIONS,
            isDefault: true,
        });
    }

    // Hydrate selectedProducts with fresh data from DB (stock, price, etc.)
    if (ProductModel && doc.sections) {
        const productIds = new Set();
        doc.sections.forEach(section => {
            if (section.config && section.config.selectedProducts) {
                section.config.selectedProducts.forEach(p => {
                    if (p._id) productIds.add(p._id.toString());
                });
            }
        });

        if (productIds.size > 0) {
            const products = await ProductModel.find({ _id: { $in: Array.from(productIds) } }).lean();
            const productMap = products.reduce((acc, p) => {
                acc[p._id.toString()] = p;
                return acc;
            }, {});

            doc.sections = doc.sections.map(section => {
                    if (section.config && section.config.selectedProducts) {
                        section.config.selectedProducts = section.config.selectedProducts
                            .map(p => {
                                const latest = productMap[p._id.toString()];
                                return latest ? { ...p, ...latest } : null;
                            })
                            .filter(Boolean);
                }
                return section;
            });
        }
    }

    res.status(200).json({
        success: true,
        sections: doc.sections,
        isDefault: false,
    });
});

// @desc    Update homepage config (full replace)
// @route   PUT /api/homepage
// @access  Private/Admin
export const updateHomePage = expressAsyncHandler(async (req, res, next) => {
    const HomePageModel = getLocalHomePageModel();
    if (!HomePageModel) return next(new ErrorResponse("HomePage model not found", 500));

    const { sections } = req.body;

    if (!sections || !Array.isArray(sections)) {
        return next(new ErrorResponse("sections array is required", 400));
    }

    // Clean up invalid or temporary IDs from sections
    const cleanedSections = sections.map(section => {
        const cleaned = { ...section };
        // Mongoose ObjectIds are exactly 24 character hex strings.
        // If it's a temporary ID, or anything else, remove it so Mongoose generates a new one.
        if (cleaned._id && !/^[a-fA-F0-9]{24}$/.test(String(cleaned._id))) {
            delete cleaned._id;
        }
        return cleaned;
    });

    // Upsert — create if not exists, update if exists
    const doc = await HomePageModel.findOneAndUpdate(
        {},
        { sections: cleanedSections },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
        success: true,
        sections: doc.sections,
    });
});

// @desc    Reset homepage to defaults
// @route   DELETE /api/homepage
// @access  Private/Admin
export const resetHomePage = expressAsyncHandler(async (req, res, next) => {
    const HomePageModel = getLocalHomePageModel();
    if (!HomePageModel) return next(new ErrorResponse("HomePage model not found", 500));

    await HomePageModel.deleteMany({});

    res.status(200).json({
        success: true,
        sections: DEFAULT_SECTIONS,
        message: "HomePage reset to defaults",
    });
});
