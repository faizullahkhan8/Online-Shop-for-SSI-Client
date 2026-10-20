import { safeError } from "../utils/safeLog.js";
import { getLocalVendorModel } from "../config/localDb.js";
import imagekit from "../config/imagekit.js";

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Public (or Admin, depending on requirement, usually public for listing)
export const getAllVendors = async (req, res, next) => {
    try {
        const Vendor = getLocalVendorModel();
        if (!Vendor) {
            return res.status(500).json({ success: false, message: "Database not initialized" });
        }

        const vendors = await Vendor.find({}).sort({ name: 1 });
        res.status(200).json({ success: true, vendors });
    } catch (error) {
        safeError("Error fetching vendors:", error);
        return next(error);
    }
};

// @desc    Create a vendor
// @route   POST /api/vendors
// @access  Private/Admin
export const createVendor = async (req, res, next) => {
    try {
        const Vendor = getLocalVendorModel();
        if (!Vendor) {
            return res.status(500).json({ success: false, message: "Database not initialized" });
        }

        const { name, description, image, imageFileId } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Vendor name is required" });
        }

        // Check if vendor already exists
        const existingVendor = await Vendor.findOne({ name });
        if (existingVendor) {
            return res.status(400).json({ success: false, message: "Vendor already exists" });
        }

        const newVendor = await Vendor.create({
            name,
            description,
            image,
            imageFileId,
        });

        res.status(201).json({ success: true, vendor: newVendor });
    } catch (error) {
        safeError("Error creating vendor:", error);
        return next(error);
    }
};

// @desc    Update a vendor
// @route   PUT /api/vendors/:id
// @access  Private/Admin
export const updateVendor = async (req, res, next) => {
    try {
        const Vendor = getLocalVendorModel();
        if (!Vendor) {
            return res.status(500).json({ success: false, message: "Database not initialized" });
        }

        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }

        const { name, description, image, imageFileId, removeImage } = req.body;
        
        if (name && name !== vendor.name) {
            const existing = await Vendor.findOne({ name });
            if (existing) {
                return res.status(400).json({ success: false, message: "Vendor name already exists" });
            }
            vendor.name = name;
        }

        if (description !== undefined) {
            vendor.description = description;
        }

        if (removeImage === "true" || removeImage === true) {
            if (vendor.imageFileId) {
                try {
                    await imagekit.files.delete(vendor.imageFileId);
                } catch (delError) {
                    safeError("Failed to delete old image from ImageKit:", delError);
                }
            }
            vendor.image = "";
            vendor.imageFileId = "";
        } else if (image !== undefined) {
            vendor.image = image;
            vendor.imageFileId = imageFileId || "";
        }

        const updatedVendor = await vendor.save();
        res.status(200).json({ success: true, vendor: updatedVendor });
    } catch (error) {
        safeError("Error updating vendor:", error);
        return next(error);
    }
};

// @desc    Delete a vendor
// @route   DELETE /api/vendors/:id
// @access  Private/Admin
export const deleteVendor = async (req, res, next) => {
    try {
        const Vendor = getLocalVendorModel();
        if (!Vendor) {
            return res.status(500).json({ success: false, message: "Database not initialized" });
        }

        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }

        // Delete image from ImageKit
        if (vendor.imageFileId) {
            try {
                await imagekit.files.delete(vendor.imageFileId);
            } catch (delError) {
                safeError("Failed to delete image from ImageKit:", delError);
            }
        }

        await vendor.deleteOne();

        res.status(200).json({ success: true, message: "Vendor deleted successfully" });
    } catch (error) {
        safeError("Error deleting vendor:", error);
        return next(error);
    }
};


export const uploadVendorImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image provided" });
        }
        const uploadResponse = await imagekit.files.upload({
            file: req.file.buffer.toString("base64"),
            fileName: req.file.originalname,
            folder: "/vendors",
        });
        res.status(200).json({ success: true, url: uploadResponse.url, fileId: uploadResponse.fileId });
    } catch (error) {
        safeError("Error uploading vendor image:", error);
        res.status(500).json({ success: false, message: "Upload failed" });
    }
};

export const deleteVendorImage = async (req, res, next) => {
    try {
        const { fileId } = req.params;
        if (!fileId) return res.status(400).json({ success: false, message: "No fileId provided" });
        
        await imagekit.files.delete(fileId);
        res.status(200).json({ success: true, message: "Image deleted" });
    } catch (error) {
        safeError("Error deleting vendor image:", error);
        res.status(500).json({ success: false, message: "Delete failed" });
    }
};

