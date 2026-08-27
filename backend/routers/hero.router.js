import express from "express";
import {
    getHeroSlides,
    createHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
} from "../controllers/hero.controller.js";
import {
    upload,
    handleOptionalBackgroundRemoval,
    imagekitUpload,
} from "../middlewares/multer.middleware.js";
import { authorize, isAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getHeroSlides);
router.post(
    "/",
    isAuth,
    authorize("admin"),
    upload.single("image"),
    handleOptionalBackgroundRemoval,
    imagekitUpload,
    createHeroSlide,
);
router.put(
    "/:id",
    isAuth,
    authorize("admin"),
    upload.single("image"),
    handleOptionalBackgroundRemoval,
    imagekitUpload,
    updateHeroSlide,
);
router.delete("/:id", isAuth, authorize("admin"), deleteHeroSlide);

export default router;
