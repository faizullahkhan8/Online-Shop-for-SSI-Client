import expressAsyncHandler from "express-async-handler";
import { getLocalMenuModel } from "../config/localDb.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";

// @desc    Get all menu items (nested tree)
// @route   GET /api/menus
// @access  Public
export const getMenus = expressAsyncHandler(async (req, res, next) => {
    const MenuModel = getLocalMenuModel();
    if (!MenuModel) return next(new ErrorResponse("Menu model not found", 500));

    // Fetch all menus and sort by order
    const allMenus = await MenuModel.find({}).sort({ order: 1 });

    // Build the tree
    const menuMap = {};
    const rootMenus = [];

    // Initialize map
    allMenus.forEach((item) => {
        menuMap[item._id.toString()] = { ...item.toObject(), children: [] };
    });

    // Populate children
    allMenus.forEach((item) => {
        if (item.parentId) {
            const parent = menuMap[item.parentId.toString()];
            if (parent) {
                parent.children.push(menuMap[item._id.toString()]);
            } else {
                // If parent doesn't exist, treat as root to avoid orphan loss
                rootMenus.push(menuMap[item._id.toString()]);
            }
        } else {
            rootMenus.push(menuMap[item._id.toString()]);
        }
    });

    res.status(200).json({
        success: true,
        menus: rootMenus,
    });
});

// @desc    Create a menu item
// @route   POST /api/menus
// @access  Private/Admin
export const createMenu = expressAsyncHandler(async (req, res, next) => {
    const MenuModel = getLocalMenuModel();
    if (!MenuModel) return next(new ErrorResponse("Menu model not found", 500));

    const { title, type, link, parentId, order } = req.body;

    if (!title || !link) {
        return next(new ErrorResponse("Title and link are required", 400));
    }

    const menu = await MenuModel.create({
        title,
        type: type || "CUSTOM_LINK",
        link,
        parentId: parentId || null,
        order: order || 0,
    });

    res.status(201).json({
        success: true,
        menu,
    });
});

// @desc    Update a menu item
// @route   PUT /api/menus/:id
// @access  Private/Admin
export const updateMenu = expressAsyncHandler(async (req, res, next) => {
    const MenuModel = getLocalMenuModel();
    if (!MenuModel) return next(new ErrorResponse("Menu model not found", 500));

    let menu = await MenuModel.findById(req.params.id);

    if (!menu) {
        return next(new ErrorResponse("Menu item not found", 404));
    }

    const { title, type, link, parentId, order } = req.body;

    menu.title = title || menu.title;
    menu.type = type || menu.type;
    menu.link = link || menu.link;
    menu.parentId = parentId !== undefined ? parentId : menu.parentId;
    menu.order = order !== undefined ? order : menu.order;

    await menu.save();

    res.status(200).json({
        success: true,
        menu,
    });
});

// @desc    Delete a menu item
// @route   DELETE /api/menus/:id
// @access  Private/Admin
export const deleteMenu = expressAsyncHandler(async (req, res, next) => {
    const MenuModel = getLocalMenuModel();
    if (!MenuModel) return next(new ErrorResponse("Menu model not found", 500));

    const menu = await MenuModel.findById(req.params.id);

    if (!menu) {
        return next(new ErrorResponse("Menu item not found", 404));
    }

    // Optionally: delete all children recursively
    const deleteChildren = async (parentId) => {
        const children = await MenuModel.find({ parentId });
        for (const child of children) {
            await deleteChildren(child._id);
            await child.deleteOne();
        }
    };
    
    await deleteChildren(menu._id);
    await menu.deleteOne();

    res.status(200).json({
        success: true,
        data: {},
    });
});
