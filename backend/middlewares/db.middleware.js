import { connectToDB } from "../config/localDb.js";

export const setLocalDB = async (req, res, next) => {
    try {
        await connectToDB();
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Database connection failed" });
    }
};
