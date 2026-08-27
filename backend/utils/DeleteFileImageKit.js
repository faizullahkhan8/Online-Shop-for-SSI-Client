import imagekit from "../config/imagekit.js";

export const deleteImageKitFile = async (fileId) => {
    try {
        const result = await imagekit.files.delete(fileId);
        return result;
    } catch (err) {
        throw err;
    }
};
