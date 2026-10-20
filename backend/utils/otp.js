import crypto from "node:crypto";
export const generateOTP = () => crypto.randomInt(100000, 1000000).toString();
export const hashOTP = otp => crypto.createHmac("sha256", process.env.JWT_ACCESS_SECRET).update(otp).digest("hex");
export function matchesOTP(otp, stored) {
    if (typeof otp !== "string" || !/^\d{6}$/.test(otp) || typeof stored !== "string") return false;
    // Existing six-digit records remain valid until their original expiry.
    const candidate = stored.length === 64 ? hashOTP(otp) : otp;
    return candidate.length === stored.length && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(stored));
}
