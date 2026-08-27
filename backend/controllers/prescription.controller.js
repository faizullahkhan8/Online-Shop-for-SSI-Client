import expressAsyncHandler from "express-async-handler";
import { getLocalPrescriptionModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { deleteImageKitFile } from "../utils/DeleteFileImageKit.js";
import { emitNewPrescription, emitPrescriptionStatusUpdate } from "../config/socket.js";
import { sendSMS } from "../utils/smsService.js";

export const getUnreadPrescriptionsCount = expressAsyncHandler(async (req, res, next) => {
    const PrescriptionModel = getLocalPrescriptionModel();
    if (!PrescriptionModel) return next(new ErrorResponse("Prescription model not found", 500));
    const count = await PrescriptionModel.countDocuments({ isViewed: { $ne: true } });
    res.status(200).json({ success: true, count });
});

export const markPrescriptionViewed = expressAsyncHandler(async (req, res, next) => {
    const PrescriptionModel = getLocalPrescriptionModel();
    if (!PrescriptionModel) return next(new ErrorResponse("Prescription model not found", 500));
    
    const prescription = await PrescriptionModel.findById(req.params.id);
    if (!prescription) return next(new ErrorResponse("Prescription not found", 404));
    
    prescription.isViewed = true;
    await prescription.save({ validateModifiedOnly: true });

    try {
        emitPrescriptionStatusUpdate(prescription);
    } catch (socketErr) {
        console.error("[Socket.io] Failed to emit prescription view update:", socketErr);
    }
    
    res.status(200).json({ success: true, message: "Marked as viewed" });
});

// @desc    Upload a new prescription
// @route   POST /api/prescriptions
// @access  Private
export const uploadPrescription = expressAsyncHandler(async (req, res, next) => {
    const PrescriptionModel = getLocalPrescriptionModel();
    if (!PrescriptionModel) return next(new ErrorResponse("Prescription model not found", 500));

    if (!req.image) {
        return next(new ErrorResponse("Prescription image is required", 400));
    }

    const { name, phone, address_text, address_lat, address_lng, notes } = req.body;

    if (!name || !phone || !address_lat || !address_lng) {
        return next(new ErrorResponse("Name, phone, and map location are required", 400));
    }

    const prescription = await PrescriptionModel.create({
        userId: req.user?._id || undefined,
        name,
        phone,
        address: {
            text: address_text || "",
            lat: parseFloat(address_lat),
            lng: parseFloat(address_lng),
        },
        image: req.image.filePath,
        imagekitFileId: req.image.fileId,
        notes: notes || "",
    });

    try {
        emitNewPrescription(prescription);
    } catch (socketErr) {
        console.error("[Socket.io] Failed to emit new prescription:", socketErr);
    }

    // Send SMS
    if (phone) {
        await sendSMS("PRESCRIPTION_UPLOADED", phone, { name: name || "Customer" });
    }

    res.status(201).json({
        success: true,
        prescription,
        message: "Prescription uploaded successfully. We will review it shortly.",
    });
});

// @desc    Get all prescriptions (Admin)
// @route   GET /api/prescriptions
// @access  Private/Admin
export const getAllPrescriptions = expressAsyncHandler(async (req, res, next) => {
    const PrescriptionModel = getLocalPrescriptionModel();
    if (!PrescriptionModel) return next(new ErrorResponse("Prescription model not found", 500));

    const prescriptions = await PrescriptionModel.find({})
        .populate("userId", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        prescriptions,
    });
});

// @desc    Get user prescriptions
// @route   GET /api/prescriptions/my
// @access  Private
export const getUserPrescriptions = expressAsyncHandler(async (req, res, next) => {
    const PrescriptionModel = getLocalPrescriptionModel();
    if (!PrescriptionModel) return next(new ErrorResponse("Prescription model not found", 500));

    const prescriptions = await PrescriptionModel.find({ userId: req.user._id })
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        prescriptions,
    });
});

// @desc    Update prescription status (Admin)
// @route   PUT /api/prescriptions/:id/status
// @access  Private/Admin
export const updatePrescriptionStatus = expressAsyncHandler(async (req, res, next) => {
    const PrescriptionModel = getLocalPrescriptionModel();
    if (!PrescriptionModel) return next(new ErrorResponse("Prescription model not found", 500));

    const { status } = req.body;
    
    if (!["pending", "processing", "completed", "rejected"].includes(status)) {
        return next(new ErrorResponse("Invalid status", 400));
    }

    const prescription = await PrescriptionModel.findById(req.params.id);

    if (!prescription) {
        return next(new ErrorResponse("Prescription not found", 404));
    }

    prescription.status = status;
    await prescription.save();

    try {
        emitPrescriptionStatusUpdate(prescription);
    } catch (socketErr) {
        console.error("[Socket.io] Failed to emit prescription status update:", socketErr);
    }

    // Send SMS
    if (prescription.phone) {
        await sendSMS("PRESCRIPTION_UPDATE", prescription.phone, { name: prescription.name || "Customer", status: status });
    }

    res.status(200).json({
        success: true,
        prescription,
        message: "Prescription status updated",
    });
});

// @desc    Delete prescription (Admin)
// @route   DELETE /api/prescriptions/:id
// @access  Private/Admin
export const deletePrescription = expressAsyncHandler(async (req, res, next) => {
    const PrescriptionModel = getLocalPrescriptionModel();
    if (!PrescriptionModel) return next(new ErrorResponse("Prescription model not found", 500));

    const prescription = await PrescriptionModel.findById(req.params.id);

    if (!prescription) {
        return next(new ErrorResponse("Prescription not found", 404));
    }

    if (prescription.imagekitFileId) {
        await deleteImageKitFile(prescription.imagekitFileId);
    }

    await prescription.deleteOne();

    res.status(200).json({
        success: true,
        message: "Prescription deleted successfully",
    });
});
