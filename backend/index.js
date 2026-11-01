import businessRouter from "./routers/business.router.js";
import { startNotificationWorker } from "./services/notificationOutbox.js";
import { allowedOrigins } from "./utils/allowedOrigins.js";
import { securityConfigIssues } from "./utils/securityConfig.js";
import { safeError } from "./utils/safeLog.js";
import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import { connectToDB } from "./config/localDb.js";
import { initSocket } from "./config/socket.js";
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
import homePageRouter from "./routers/homePage.router.js";
import vendorRouter from "./routers/vendor.router.js";
import staffRouter from "./routers/staff.router.js";
import smsTemplateRouter from "./routers/smsTemplate.router.js";

import { errorHandler } from "./middlewares/ErrorHandler.js";
import cookieParser from "cookie-parser";
import { ErrorResponse } from "./utils/ErrorResponse.js";
import { safeContentMiddleware } from "./utils/safeHtml.js";
dotenv.config();
if (process.env.NODE_ENV === "production") {
    const issues = securityConfigIssues(process.env);
    if (issues.length) throw new Error(`Invalid production configuration: ${issues.join("; ")}`);
}

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

app.use("/public", express.static("public"));
app.use(express.json({ limit: "2mb" }));
app.use(safeContentMiddleware);
app.use(cookieParser());
// CORS alone does not prevent cross-site form submissions with session cookies.
app.use((req, res, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        const allowed = allowedOrigins();
        if ((req.headers.origin && !allowed.includes(req.headers.origin)) ||
            (!req.headers.origin && req.headers["sec-fetch-site"] === "cross-site"))
            return next(new ErrorResponse("Untrusted request origin", 403));
    }
    next();
});
app.use(
    cors({
        origin: allowedOrigins(),
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
app.use("/api/homepage", homePageRouter);
app.use("/api/vendors", vendorRouter);
app.use("/api/staff", staffRouter);
app.use("/api/sms-templates", smsTemplateRouter);

app.use("/api/business", businessRouter);

app.use(errorHandler);

// Initial connection attempt
connectToDB().then(() => startNotificationWorker()).catch((err) =>
    safeError("Initial DB connection failed", err),
);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server and Socket.io running on port ${PORT}`);
});

export { app, server };
