import expressAsyncHandler from "express-async-handler";
import { getLocalCategoryModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { deleteImageKitFile } from "../utils/DeleteFileImageKit.js";

export const createCategory = expressAsyncHandler(async (req, res, next) => {
    const CategoryModel = getLocalCategoryModel();

    if (!CategoryModel) {
        return next(new ErrorResponse("Category model not found", 404));
    }

    let { name, parentId, isActive } = req.body;

    if (!name) {
        return next(new ErrorResponse("Name is required", 400));
    }

    if (isActive === "true" || isActive === true) isActive = true;
    else if (isActive === "false" || isActive === false) isActive = false;

    const normalizedParentId =
        parentId &&
        parentId !== "null" &&
        parentId !== "undefined" &&
        String(parentId).trim() !== ""
            ? parentId
            : null;

    const category = await CategoryModel.create({ 
        name: name.trim(), 
        parentId: normalizedParentId, 
        isActive,
        image: req.image?.filePath || "",
        imagekitFileId: req.image?.fileId || ""
    });

    const populatedCategory = await CategoryModel.findById(category._id).populate("parentId");

    res.status(201).json({
        success: true,
        message: "Category created successfully",
        category: populatedCategory || category,
    });
});

export const getAllCategories = expressAsyncHandler(async (req, res, next) => {
    const CategoryModel = getLocalCategoryModel();

    if (!CategoryModel) {
        return next(new ErrorResponse("Category model not found", 404));
    }

    const categories = await CategoryModel.find().populate("parentId");

    res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
        categories,
    });
});

export const deleteCategory = expressAsyncHandler(async (req, res, next) => {
    const CategoryModel = getLocalCategoryModel();

    if (!CategoryModel) {
        return next(new ErrorResponse("Category model not found", 404));
    }

    const { id } = req.params;

    if (!id) {
        return next(new ErrorResponse("Category ID is required", 400));
    }

    const category = await CategoryModel.findById(id);
    if (!category) {
        return next(new ErrorResponse("Category not found", 404));
    }

    if (category.imagekitFileId) {
        try {
            await deleteImageKitFile(category.imagekitFileId);
        } catch (error) {
            console.log("Failed to delete category image from ImageKit", error);
        }
    }

    await CategoryModel.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: "Category deleted successfully",
        category,
    });
});

export const updateCategory = expressAsyncHandler(async (req, res, next) => {
    const CategoryModel = getLocalCategoryModel();

    if (!CategoryModel) {
        return next(new ErrorResponse("Category model not found", 404));
    }

    const { id } = req.params;

    if (!id) {
        return next(new ErrorResponse("Category ID is required", 400));
    }

    let { name, parentId, isActive, removeImage } = req.body;

    if (isActive === "true" || isActive === true) isActive = true;
    else if (isActive === "false" || isActive === false) isActive = false;

    const existingCategory = await CategoryModel.findById(id);
    if (!existingCategory) {
        return next(new ErrorResponse("Category not found", 404));
    }

    let image = existingCategory.image;
    let imagekitFileId = existingCategory.imagekitFileId;

    if (req.image) {
        if (existingCategory.imagekitFileId) {
            try {
                await deleteImageKitFile(existingCategory.imagekitFileId);
            } catch (error) {
                console.log("Failed to delete old category image from ImageKit", error);
            }
        }
        image = req.image.filePath;
        imagekitFileId = req.image.fileId;
    } else if (removeImage === "true" || removeImage === true) {
        if (existingCategory.imagekitFileId) {
            try {
                await deleteImageKitFile(existingCategory.imagekitFileId);
            } catch (error) {
                console.log("Failed to delete old category image from ImageKit", error);
            }
        }
        image = "";
        imagekitFileId = "";
    }

    const normalizedParentId =
        parentId &&
        parentId !== "null" &&
        parentId !== "undefined" &&
        String(parentId).trim() !== ""
            ? parentId
            : null;

    const category = await CategoryModel.findByIdAndUpdate(
        id,
        {
            name: name ? name.trim() : existingCategory.name,
            parentId: normalizedParentId,
            isActive,
            image,
            imagekitFileId,
        },
        { new: true },
    ).populate("parentId");

    res.status(200).json({
        success: true,
        message: "Category updated successfully",
        category,
    });
});
