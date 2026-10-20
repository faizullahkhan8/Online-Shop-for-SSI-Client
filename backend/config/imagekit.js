import ImageKit from "@imagekit/nodejs";
import { ErrorResponse } from "../utils/ErrorResponse.js";

let client;
// Initialize on first use so optional image configuration cannot stop checkout/auth.
export function getImageKit() {
    if (!client) {
        const { IMAGEKIT_PUBLIC_KEY: publicKey, IMAGEKIT_PRIVATE_KEY: privateKey, IMAGEKIT_URL_ENDPOINT: urlEndpoint } = process.env;
        if (!publicKey || !privateKey || !urlEndpoint) {
            throw new ErrorResponse("Image uploads require ImageKit environment configuration.", 503);
        }
        client = new ImageKit({ publicKey, privateKey, urlEndpoint });
    }
    return client;
}

export default {
    get files() {
        return getImageKit().files;
    },
};
