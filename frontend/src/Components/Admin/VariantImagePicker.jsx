import { useEffect, useId, useState } from "react";
import { ImageIcon, Check } from "lucide-react";
import { getImageUrl } from "../../utils/imageHelper";
import { variantImageIndices, availableVariantImageIndices } from "../../utils/variantImages";

function ImagePreview({ image, number }) {
    const [preview, setPreview] = useState(null);
    const file = typeof File !== "undefined" && image instanceof File;
    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(image);
        // Creating and revoking a browser object URL is an external resource lifecycle.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPreview({ file: image, url });
        return () => URL.revokeObjectURL(url);
    }, [file, image]);
    const src = file ? preview?.file === image ? preview.url : null : getImageUrl(image?.url || image?.filePath || image);
    return src ? <img src={src} alt={`Product image ${number}`} className="h-full w-full object-contain" /> : <ImageIcon size={22} aria-hidden="true" className="text-gray-400" />;
}

export default function VariantImagePicker({ variant, images, otherVariants = [], onChange }) {
    const id = useId();
    const selected = variantImageIndices(variant, images.length);
    const available = availableVariantImageIndices(variant, otherVariants, images.length);
    return <fieldset className="min-w-0 space-y-3" aria-describedby={`${id}-hint`}>
        <legend className="text-sm font-medium text-gray-700">Variant images <span className="ml-1 text-xs text-gray-500">{selected.length} selected</span></legend>
        <p id={`${id}-hint`} className="text-xs leading-5 text-gray-500">Select every image for this variant. The first selected is the main image. Images assigned to other variants are hidden.</p>
        {!images.length ? <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">Upload product images first, then select them here.</p> : !available.length ? <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">All images are assigned to other variants. Add more product images or unselect an image in another variant.</p> : <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {available.map(index => <label key={index} className="min-w-0 cursor-pointer">
                <input type="checkbox" checked={selected.includes(index)} onChange={event => onChange(event.target.checked ? [...selected, index] : selected.filter(value => value !== index))}
                    aria-label={`Image ${index + 1} for ${variant.name || "this variant"}`} className="peer sr-only" />
                <span className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50 p-1 transition-colors peer-checked:border-primary-dark peer-checked:bg-primary-pale/40 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-dark">
                    <ImagePreview image={images[index]} number={index + 1} />
                    {selected.includes(index) && <span aria-hidden="true" className="absolute right-1 top-1 rounded-md bg-primary-dark px-1.5 py-0.5 text-xs font-semibold text-white">{selected[0] === index ? "Main" : <Check size={14} />}</span>}
                </span>
                <span className="mt-1 block min-h-6 text-center text-xs font-medium text-gray-700">Image {index + 1}</span>
            </label>)}
        </div>}
    </fieldset>;
}
