import { useState } from "react";
import { toast } from "react-toastify";
import { useTeamHero, useSaveTeamHero } from "../../api/hooks/teamHero.api";
import { useUploadHomePageImage } from "../../api/hooks/homePage.api";
import { getImageUrl } from "../../utils/imageHelper";

export default function TeamHeroEditor() {
    const { data, isLoading, error, refetch } = useTeamHero();
    const [draft, setDraft] = useState(null);
    const save = useSaveTeamHero();
    const { uploadImage, loading: uploading } = useUploadHomePageImage();
    const config = draft ?? data ?? {};
    const set = (key, value) => setDraft((previous) => ({ ...(previous ?? data ?? {}), [key]: value }));
    async function upload(event, mobile) {
        const input = event.currentTarget;
        const file = input.files?.[0];
        if (!file) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
            toast.error("Choose a JPG, PNG or WebP image up to 10 MB."); input.value = ""; return;
        }
        const result = await uploadImage(file);
        if (result?.success) {
            setDraft((previous) => ({ ...(previous ?? data ?? {}), [mobile ? "mobileImage" : "image"]: result.url, [mobile ? "mobileFileId" : "imageFileId"]: result.fileId }));
        } else toast.error("Image upload failed. Please try again.");
        input.value = "";
    }
    async function submit(event) {
        event.preventDefault();
        try { await save.mutateAsync(config); setDraft(null); toast.success("Team hero saved"); }
        catch { toast.error("Could not save the team hero. Your changes are still here."); }
    }
    if (isLoading) return <p>Loading team hero settings…</p>;
    if (error) return <div className="rounded-xl border p-5">Could not load team hero settings. <button onClick={() => refetch()}>Retry</button></div>;
    return <form onSubmit={submit} className="rounded-3xl border border-gray-200 bg-white p-6 space-y-5">
        <div><h2 className="text-xl font-bold">Team page hero</h2><p className="text-sm text-gray-500 mt-1">Upload a real group photo, or leave it empty to show all staff portraits as a collage. Changes appear after saving.</p></div>
        <fieldset disabled={uploading || save.isPending} className="space-y-5 disabled:opacity-60">
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={config.enabled !== false} onChange={(event) => set("enabled", event.target.checked)} /> Show team hero</label>
            <div className="grid md:grid-cols-2 gap-5">{[false, true].map((mobile) => {
                const key = mobile ? "mobileImage" : "image";
                const x = mobile ? "mobileFocusX" : "focusX";
                const y = mobile ? "mobileFocusY" : "focusY";
                return <div key={key} className="border rounded-xl p-4 space-y-3">
                    <label className="block text-sm font-semibold">{mobile ? "Mobile photo (optional)" : "Group photo"}<input className="block mt-2 w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event, mobile)} /></label>
                    <p className="text-xs text-gray-500">{mobile ? "Portrait crop recommended. Otherwise the main image is used." : "Landscape photo recommended, at least 1800 × 1000 px. JPG, PNG or WebP, up to 10 MB."}</p>
                    {(config[key] || (mobile && config.image)) && <>
                        <img src={getImageUrl(config[key] || config.image)} alt="Hero crop preview" style={{ width: "100%", height: mobile ? 240 : 180, objectFit: "cover", objectPosition: `${config[x] ?? 50}% ${config[y] ?? 50}%` }} className="rounded-lg" />
                        {[x, y].map((field, index) => <label key={field} className="block text-xs">{index ? "Vertical focus" : "Horizontal focus"}<input type="range" min="0" max="100" value={config[field] ?? 50} onChange={(event) => set(field, Number(event.target.value))} className="block w-full" /></label>)}
                        {config[key] && <button type="button" className="text-sm text-red-600" onClick={() => { set(key, ""); set(mobile ? "mobileFileId" : "imageFileId", ""); }}>Remove photo</button>}
                    </>}
                </div>;
            })}</div>
            <div className="grid md:grid-cols-2 gap-4">{[["eyebrow", "Small heading", "Together, we are Zada"], ["heading", "Headline", "One team.\nOne commitment to care."], ["description", "Description", "Meet the people who bring care, dedication and a personal touch to Zada Pharmacy."], ["buttonText", "Button label", "Meet our people"], ["alt", "Photo description (accessibility)", "The Zada Pharmacy team together"]].map(([key, label, fallback]) => <label key={key} className="block text-sm">{label}<textarea maxLength={key === "description" ? 1000 : 200} rows={key === "description" ? 3 : 2} value={config[key] ?? fallback} onChange={(event) => set(key, event.target.value)} className="block w-full border rounded-xl p-3 mt-1" /></label>)}</div>
            <button type="submit" className="bg-primary text-white px-5 py-3 rounded-xl font-semibold">{save.isPending ? "Saving…" : uploading ? "Uploading…" : "Save team hero"}</button>
        </fieldset>
    </form>;
}
