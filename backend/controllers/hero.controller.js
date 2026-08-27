import expressAsyncHandler from "express-async-handler";
import { getLocalHeroModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { deleteImageKitFile } from "../utils/DeleteFileImageKit.js";

export const getHeroSlides = expressAsyncHandler(async (req, res, next) => {
    const HeroModel = getLocalHeroModel();
    if (!HeroModel) return next(new ErrorResponse("Hero model not found", 500));

    const slides = await HeroModel.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, slides });
});

export const createHeroSlide = expressAsyncHandler(async (req, res, next) => {
    const HeroModel = getLocalHeroModel();
    if (!HeroModel) return next(new ErrorResponse("Hero model not found", 500));

    const data = JSON.parse(req.body.data);
    const { order } = data;

    if (!req.image) return next(new ErrorResponse("Image is required", 400));

    const slide = await HeroModel.create({
        image: req.image.filePath || "",
        imagekitFileId: req.image.fileId || "",
        order,
    });

    res.status(201).json({ success: true, slide, message: "Slide created successfully" });
});

export const updateHeroSlide = expressAsyncHandler(async (req, res, next) => {
    const HeroModel = getLocalHeroModel();
    if (!HeroModel) return next(new ErrorResponse("Hero model not found", 500));

    const { id } = req.params;
    const data = JSON.parse(req.body.data);
    const { order, isActive } = data;

    const slide = await HeroModel.findById(id);
    if (!slide) return next(new ErrorResponse("Slide not found", 404));

    if (req.image) {
        await deleteImageKitFile(slide.imagekitFileId);
        slide.image = req.image.filePath || "";
        slide.imagekitFileId = req.image.fileId || "";
    }

    slide.order = order !== undefined ? order : slide.order;
    slide.isActive = isActive !== undefined ? isActive : slide.isActive;

    await slide.save();

    res.status(200).json({ success: true, slide, message: "Slide updated successfully" });
});

export const deleteHeroSlide = expressAsyncHandler(async (req, res, next) => {
    const HeroModel = getLocalHeroModel();
    if (!HeroModel) return next(new ErrorResponse("Hero model not found", 500));

    const { id } = req.params;
    const slide = await HeroModel.findById(id);
    if (!slide) return next(new ErrorResponse("Slide not found", 404));

    await deleteImageKitFile(slide.imagekitFileId);

    await slide.deleteOne();

    res.status(200).json({ success: true, message: "Slide deleted successfully" });
});
