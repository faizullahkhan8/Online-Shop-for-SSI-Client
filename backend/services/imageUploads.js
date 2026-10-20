import { ErrorResponse } from "../utils/ErrorResponse.js";
import { safeError } from "../utils/safeLog.js";

export async function uploadImageBatch(files, client) {
    const results = await Promise.allSettled(files.map(file => client.upload({
        file: file.buffer.toString("base64"), fileName: file.originalname,
        folder: "/products", useUniqueFileName: true,
    })));
    if (results.some(result => result.status === "rejected")) {
        await Promise.all(results.filter(result => result.status === "fulfilled").map(async result => {
            try { await client.delete(result.value.fileId); }
            catch (error) { safeError("upload_cleanup_failed", error); }
        }));
        throw new ErrorResponse("Image upload failed. Please try again.", 503);
    }
    return results.map(result => result.value);
}
