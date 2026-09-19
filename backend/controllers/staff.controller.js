import expressAsyncHandler from "express-async-handler";
import { getLocalStaffModel, getLocalHomePageModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";

// @desc    Get all staff nodes
// @route   GET /api/staff
// @access  Public
export const getStaff = expressAsyncHandler(async (req, res, next) => {
    const StaffModel = getLocalStaffModel();
    if (!StaffModel) return next(new ErrorResponse("Staff model not found", 500));

    const staff = await StaffModel.find({});

    res.status(200).json({
        success: true,
        count: staff.length,
        data: staff,
    });
});

// @desc    Create new staff node
// @route   POST /api/staff
// @access  Private/Admin
export const createStaff = expressAsyncHandler(async (req, res, next) => {
    const StaffModel = getLocalStaffModel();
    if (!StaffModel) return next(new ErrorResponse("Staff model not found", 500));

    const bodyData = req.body.data ? JSON.parse(req.body.data) : req.body;
    const { name, role, description, parentId } = bodyData;
    let image = bodyData.image;

    if (req.image) {
        image = req.image.filePath;
    }

    if (!name || !role) {
        return next(new ErrorResponse("Please provide name and role", 400));
    }

    const newStaff = await StaffModel.create({
        name,
        role,
        description: description || "",
        image: image || "",
        parentId: parentId || null,
    });

    res.status(201).json({
        success: true,
        data: newStaff,
    });
});

// @desc    Update a staff node
// @route   PUT /api/staff/:id
// @access  Private/Admin
export const updateStaff = expressAsyncHandler(async (req, res, next) => {
    const StaffModel = getLocalStaffModel();
    if (!StaffModel) return next(new ErrorResponse("Staff model not found", 500));

    let staffNode = await StaffModel.findById(req.params.id);

    if (!staffNode) {
        return next(new ErrorResponse("Staff node not found", 404));
    }

    const bodyData = req.body.data ? JSON.parse(req.body.data) : req.body;
    
    // If a new image was uploaded, use it.
    if (req.image) {
        bodyData.image = req.image.filePath;
    }

    // Prevent circular reference: A node cannot be its own parent
    if (bodyData.parentId === req.params.id) {
        return next(new ErrorResponse("A node cannot be its own parent", 400));
    }

    staffNode = await StaffModel.findByIdAndUpdate(req.params.id, bodyData, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: staffNode,
    });
});

// @desc    Delete a staff node
// @route   DELETE /api/staff/:id
// @access  Private/Admin
export const deleteStaff = expressAsyncHandler(async (req, res, next) => {
    const StaffModel = getLocalStaffModel();
    if (!StaffModel) return next(new ErrorResponse("Staff model not found", 500));

    const staffNode = await StaffModel.findById(req.params.id);

    if (!staffNode) {
        return next(new ErrorResponse("Staff node not found", 404));
    }

    // Unset parentId for children of this node before deleting
    await StaffModel.updateMany({ parentId: req.params.id }, { parentId: null });

    await StaffModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        data: {},
    });
});

// Team hero uses its own update so editing it cannot overwrite homepage sections.
export const getTeamHero = expressAsyncHandler(async (req, res, next) => {
    const HomePageModel = getLocalHomePageModel();
    if (!HomePageModel) return next(new ErrorResponse("HomePage model not found", 500));

    const page = await HomePageModel.findOne({}).select("teamHero");
    res.json({ success: true, data: page?.teamHero || {} });
});

export const updateTeamHero = expressAsyncHandler(async (req, res, next) => {
    const HomePageModel = getLocalHomePageModel();
    if (!HomePageModel) return next(new ErrorResponse("HomePage model not found", 500));

    const fields = ["enabled", "image", "imageFileId", "mobileImage", "mobileFileId", "alt", "eyebrow", "heading", "description", "buttonText", "focusX", "focusY", "mobileFocusX", "mobileFocusY"];
    const update = {};
    for (const field of fields) {
        if (req.body[field] === undefined) continue;
        const value = req.body[field];
        const numeric = ["focusX", "focusY", "mobileFocusX", "mobileFocusY"].includes(field);
        if ((numeric && (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100)) || (field === "enabled" && typeof value !== "boolean") || (!numeric && field !== "enabled" && typeof value !== "string")) {
            return next(new ErrorResponse("Invalid team hero field: " + field, 400));
        }
        if (["image", "mobileImage"].includes(field) && value && !/^(https:\/\/|\/(?!\/))/.test(value)) {
            return next(new ErrorResponse("Use an uploaded image or an HTTPS image URL", 400));
        }
        update["teamHero." + field] = value;
    }
    if (!Object.keys(update).length) return next(new ErrorResponse("No hero settings provided", 400));
    try {
        const page = await HomePageModel.findOneAndUpdate({}, { $set: update }, { upsert: true, returnDocument: "after", runValidators: true });
        res.json({ success: true, data: page.teamHero });
    } catch (error) {
        if (error.name === "ValidationError") return next(new ErrorResponse("Please check the hero text length and image settings", 400));
        throw error;
    }
});
