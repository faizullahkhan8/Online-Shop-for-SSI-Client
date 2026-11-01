import { validateProductInput } from "../middlewares/productInput.js";
import { Router } from "express";
import {
    handleOptionalBackgroundRemoval,
    upload,
    imagekitUpload,
} from "../middlewares/multer.middleware.js";
import {
    createProduct,
    adjustProductStock,
    restoreProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getProductForEdit,
} from "../controllers/product.controller.js";
import { authorize, isAuth } from "../middlewares/auth.middleware.js";
import { getAllProducts } from "../controllers/product.controller.js";

const router = Router();

router.post(
    "/create",
    isAuth,
    authorize(["admin"]),
    upload.array("images", 5),
    validateProductInput,
    handleOptionalBackgroundRemoval,
    imagekitUpload,
    createProduct,
    adjustProductStock,
    restoreProduct,
);
router.patch(
    "/update/:id",
    isAuth,
    authorize(["admin"]),
    upload.array("images", 5),
    validateProductInput,
    handleOptionalBackgroundRemoval,
    imagekitUpload,
    updateProduct,
);
router.post("/:id/stock-adjustments", isAuth, authorize("admin"), adjustProductStock);
router.post("/:id/restore", isAuth, authorize("admin"), restoreProduct);
router.get("/archived", isAuth, authorize("admin"), (req, res, next) => { req.archivedCatalog = true; next(); }, getAllProducts);
router.get("/all", getAllProducts);
router.delete("/delete/:id", isAuth, authorize(["admin"]), deleteProduct);
router.get("/admin/:id/edit", isAuth, authorize("admin"), getProductForEdit);
router.get("/get/:id", getProductById);

export default router;
