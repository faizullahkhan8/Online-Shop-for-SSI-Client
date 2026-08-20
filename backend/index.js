import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectToDB } from "./config/localDb.js";
import userRouter from "./routers/user.router.js";
import productRouter from "./routers/product.router.js";
import categoryRouter from "./routers/category.router.js";
import orderRouter from "./routers/order.router.js";
import settingsRouter from "./routers/settings.router.js";
import promotionRouter from "./routers/promotion.router.js";
import heroRouter from "./routers/hero.router.js";
import reviewRouter from "./routers/review.router.js";
import prescriptionRouter from "./routers/prescription.router.js";
import menuRouter from "./routers/menu.router.js";

import { errorHandler } from "./middlewares/ErrorHandler.js";
import cookieParser from "cookie-parser";
import { ErrorResponse } from "./utils/ErrorResponse.js";
dotenv.config();

const app = express();
app.use("/public", express.static("public"));
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(
    cors({
        origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
    }),
);

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
    try {
        await connectToDB();
        next();
    } catch (error) {
        return next(new ErrorResponse("Database connection failed", 500));
    }
});

app.get("/", (req, res) => {
    res.json({ message: "Welcome to the API" });
});

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/orders", orderRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/promotions", promotionRouter);
app.use("/api/hero", heroRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/prescriptions", prescriptionRouter);
app.use("/api/menus", menuRouter);

app.use(errorHandler);

// Initial connection attempt
connectToDB().catch((err) =>
    console.error("Initial DB connection failed:", err),
);

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
