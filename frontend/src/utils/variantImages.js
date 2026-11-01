export function variantImageIndices(variant, imageCount) {
    if (!variant) return [];
    const indices = Array.isArray(variant.imageIndices) ? variant.imageIndices : [Number(variant.imageIndex ?? 0)];
    return [...new Set(indices)].filter(index => Number.isSafeInteger(index) && index >= 0 && index < imageCount);
}

export function variantGallery(product, variant) {
    const images = product?.images?.length ? product.images : product?.image ? [{ filePath: product.image }] : [];
    const indices = variantImageIndices(variant, images.length);
    return indices.length ? indices.map(index => images[index]) : images;
}

export function remapVariantAfterImageRemoval(variant, removedIndex, imageCount) {
    const imageIndices = variantImageIndices(variant, imageCount).filter(index => index !== removedIndex).map(index => index > removedIndex ? index - 1 : index);
    return { ...variant, imageIndices, imageIndex: imageIndices[0] ?? 0 };
}

export function availableVariantImageIndices(variant, others, imageCount) {
    const own = new Set(variantImageIndices(variant, imageCount));
    const taken = new Set(others.flatMap(other => variantImageIndices(other, imageCount)));
    return Array.from({ length: imageCount }, (_, index) => index).filter(index => own.has(index) || !taken.has(index));
}
