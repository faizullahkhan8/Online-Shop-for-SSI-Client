import { Router } from "express";
import { authorize, isAuth } from "../middlewares/auth.middleware.js";
import {
    handleOptionalBackgroundRemoval,
    upload,
    imagekitUpload,
} from "../middlewares/multer.middleware.js";
import {
    createCategory,
    getAllCategories,
    deleteCategory,
    updateCategory,
} from "../controllers/category.controller.js";

const router = Router();

router.post(
    "/create", 
    isAuth, 
    authorize(["admin"]), 
    upload.single("image"),
    imagekitUpload,
    createCategory
);
router.get("/all", getAllCategories);
router.delete("/delete/:id", isAuth, authorize(["admin"]), deleteCategory);
router.patch(
    "/update/:id", 
    isAuth, 
    authorize(["admin"]), 
    upload.single("image"),
    imagekitUpload,
    updateCategory
);

export default router;
