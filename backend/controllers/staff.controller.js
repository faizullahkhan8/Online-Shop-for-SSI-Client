import expressAsyncHandler from "express-async-handler";
import { getLocalStaffModel } from "../config/localDb.js";
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
