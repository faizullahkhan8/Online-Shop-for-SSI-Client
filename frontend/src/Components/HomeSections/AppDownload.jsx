import { Smartphone } from "lucide-react";
import QRCode from "react-qr-code";
const storeUrl = value => { try { const url = new URL(value); return url.protocol === "https:" && ["apps.apple.com", "play.google.com"].includes(url.hostname) ? url.href : null; } catch { return null; } };
const AppDownload = ({ config = {} }) => {
    const apple = storeUrl(config.appStoreLink), google = storeUrl(config.playStoreLink);
    if (!apple && !google) return null;
    return <section className="max-w-[1400px] mx-auto px-4 lg:px-8 mt-12">
        <div className="bg-primary-pale border border-primary-light rounded-2xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="max-w-xl"><Smartphone size={28} className="text-primary-dark mb-4" /><h3 className="text-2xl sm:text-3xl text-gray-900 mb-3">{config.title || "Shop with Zada"}</h3><p className="text-sm text-gray-700 mb-5">{config.subtitle || "Find Zada in your app store."}</p><div className="flex flex-wrap gap-3">{apple && <a className="px-5 py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm" href={apple}>Download on the App Store</a>}{google && <a className="px-5 py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm" href={google}>Get it on Google Play</a>}</div></div>
            <div className="bg-white rounded-xl p-4 shrink-0"><QRCode value={apple || google} size={112} /><p className="text-sm text-gray-600 mt-3 text-center">Scan to download</p></div>
        </div>
    </section>;
};
export default AppDownload;
