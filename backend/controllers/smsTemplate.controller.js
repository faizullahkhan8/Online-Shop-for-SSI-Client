import expressAsyncHandler from "express-async-handler";
import { getLocalSmsTemplateModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";

const DEFAULT_TEMPLATES = [
    { eventName: "REGISTRATION_OTP", messageTemplate: "Your verification OTP is {{otp}}. Please do not share this with anyone.", isActive: true },
    { eventName: "LOGIN_OTP", messageTemplate: "Your login OTP is {{otp}}. Please do not share this with anyone.", isActive: true },
    { eventName: "PRESCRIPTION_UPLOADED", messageTemplate: "Hi {{name}}, your prescription has been successfully uploaded and is pending review.", isActive: true },
    { eventName: "PRESCRIPTION_UPDATE", messageTemplate: "Hi {{name}}, the status of your prescription has been updated to: {{status}}.", isActive: true },
    { eventName: "ORDER_PLACED", messageTemplate: "Hi {{name}}, your order {{orderId}} has been successfully placed. Total: Rs.{{amount}}.", isActive: true },
    { eventName: "ORDER_UPDATE", messageTemplate: "Hi {{name}}, your order {{orderId}} status has been updated to: {{status}}.", isActive: true }
];

// @desc    Get all SMS templates
// @route   GET /api/sms-templates
// @access  Private/Admin
export const getSmsTemplates = expressAsyncHandler(async (req, res, next) => {
    const SmsTemplateModel = getLocalSmsTemplateModel();
    if (!SmsTemplateModel) return next(new ErrorResponse("Database model not found", 500));

    const templates = await SmsTemplateModel.find({}).sort({ eventName: 1 });
    
    res.status(200).json({
        success: true,
        templates
    });
});

// @desc    Seed default SMS templates
// @route   POST /api/sms-templates/seed
// @access  Private/Admin
export const seedSmsTemplates = expressAsyncHandler(async (req, res, next) => {
    const SmsTemplateModel = getLocalSmsTemplateModel();
    if (!SmsTemplateModel) return next(new ErrorResponse("Database model not found", 500));

    for (const template of DEFAULT_TEMPLATES) {
        const existing = await SmsTemplateModel.findOne({ eventName: template.eventName });
        if (!existing) {
            await SmsTemplateModel.create(template);
        }
    }

    const templates = await SmsTemplateModel.find({}).sort({ eventName: 1 });

    res.status(200).json({
        success: true,
        message: "Templates seeded successfully",
        templates
    });
});

// @desc    Update an SMS template
// @route   PUT /api/sms-templates/:id
// @access  Private/Admin
export const updateSmsTemplate = expressAsyncHandler(async (req, res, next) => {
    const SmsTemplateModel = getLocalSmsTemplateModel();
    if (!SmsTemplateModel) return next(new ErrorResponse("Database model not found", 500));

    const { messageTemplate, isActive } = req.body;

    const template = await SmsTemplateModel.findById(req.params.id);
    if (!template) {
        return next(new ErrorResponse("Template not found", 404));
    }

    if (messageTemplate !== undefined) template.messageTemplate = messageTemplate;
    if (isActive !== undefined) template.isActive = isActive;

    await template.save();

    res.status(200).json({
        success: true,
        message: "Template updated successfully",
        template
    });
});
