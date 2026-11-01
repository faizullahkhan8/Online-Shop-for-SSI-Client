import { it } from "node:test";
import assert from "node:assert/strict";
import { variantGallery, variantImageIndices, remapVariantAfterImageRemoval, availableVariantImageIndices } from "../src/utils/variantImages.js";

it("preserves legacy images and returns the selected variant gallery in main-image order", () => {
    const product = { images: [{ url: "front" }, { url: "side" }, { url: "back" }] };
    assert.deepEqual(variantGallery(product, { imageIndex: 1 }), [product.images[1]]);
    assert.deepEqual(variantGallery(product, { imageIndices: [2, 0], imageIndex: 0 }), [product.images[2], product.images[0]]);
    assert.deepEqual(variantGallery(product, { imageIndices: [] }), product.images);
    assert.deepEqual(variantGallery({ image: "legacy.webp" }, { imageIndex: 0 }), [{ filePath: "legacy.webp" }]);
    assert.deepEqual(variantGallery(null, null), []);
    assert.deepEqual(variantImageIndices({ imageIndices: [0, 0, -1, 8, 1.5] }, 3), [0]);
});
it("remaps retained images after deletion without assigning a different photo", () => {
    assert.deepEqual(remapVariantAfterImageRemoval({ imageIndices: [0, 2], imageIndex: 0 }, 0, 3), { imageIndices: [1], imageIndex: 1 });
    assert.deepEqual(remapVariantAfterImageRemoval({ imageIndex: 2 }, 1, 3), { imageIndices: [1], imageIndex: 1 });
    assert.deepEqual(remapVariantAfterImageRemoval({ imageIndex: 1 }, 1, 3), { imageIndices: [], imageIndex: 0 });
});

it("hides other variants' assigned images while retaining current selections and released images", () => {
    const own = { imageIndices: [1] };
    const other = { imageIndices: [0, 2] };
    assert.deepEqual(availableVariantImageIndices(own, [other], 4), [1, 3]);
    assert.deepEqual(availableVariantImageIndices({ imageIndices: [] }, [own, other], 3), []);
    assert.deepEqual(availableVariantImageIndices(own, [{ imageIndices: [2] }], 4), [0, 1, 3]);
    assert.deepEqual(availableVariantImageIndices(own, [{ imageIndex: 1 }], 2), [0, 1]);
});
