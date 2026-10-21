import { useLocation } from "react-router-dom";
import Skeleton, { ProductGridSkeleton } from "./Skeleton";

const Lines = ({ count = 3 }) => <div className="space-y-3">{Array.from({ length: count }, (_, i) => <Skeleton key={i} className={`h-4 ${i === count - 1 ? "w-2/3" : "w-full"}`} />)}</div>;
const Panel = ({ children, className = "" }) => <div className={`rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 ${className}`}>{children}</div>;
const Fields = () => <div className="grid gap-6 sm:grid-cols-2">{Array.from({ length: 6 }, (_, i) => <div key={i} className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-11 w-full" /></div>)}</div>;

export function loadingVariant(pathname) {
    const path = pathname.replace(/\/+$/, "") || "/";
    if (path === "/admin-dashboard") return "dashboard";
    if (path.startsWith("/admin-dashboard")) {
        if (/add|create|edit|settings|tax|shipping|promotion-builder|sms/.test(path)) return "form";
        if (/orders\/.+/.test(path)) return "order";
        if (/builder|staff/.test(path)) return "builder";
        if (path.endsWith("/promotions")) return "promotions";
        return "table";
    }
    if (path === "/") return "home";
    if (path.startsWith("/product/")) return "product";
    if (path === "/products" || path === "/wishlist") return "catalog";
    if (path.startsWith("/orders/success")) return "order";
    if (path === "/orders" || path === "/cart") return "orders";
    if (path === "/our-team") return "team";
    if (/checkout|profile|upload-prescription|contact-us/.test(path)) return "form";
    if (path === "/promotions") return "promotions";
    return "content";
}

/** Loading is announced once; decorative placeholders never enter the tab order. */
export function PageLoading({ variant = "content", label = "Loading page…", className = "" }) {
    let content;
    switch (variant) {
        case "home":
            content = <><Skeleton className="h-56 w-full sm:h-80 lg:h-96" /><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Panel key={i}><Lines count={2} /></Panel>)}</div><ProductGridSkeleton count={6} /></>;
            break;
        case "catalog":
            content = <><div className="flex justify-between gap-4"><Skeleton className="h-11 w-48" /><Skeleton className="h-11 w-28" /></div><ProductGridSkeleton count={10} /></>;
            break;
        case "product":
            content = <><Skeleton className="h-4 w-2/3" /><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="aspect-square w-full" /><Panel className="space-y-6"><Skeleton className="h-8 w-4/5" /><Lines count={4} /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></Panel><Panel className="space-y-6"><Lines count={3} /><Skeleton className="h-40 w-full" /><Lines /></Panel></div><Panel><Lines count={5} /></Panel></>;
            break;
        case "table":
            content = <Panel className="overflow-hidden"><div className="mb-6 flex gap-4"><Skeleton className="h-11 w-2/3" /><Skeleton className="h-11 w-1/3" /></div><div className="space-y-5">{Array.from({ length: 7 }, (_, i) => <div key={i} className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-5"><Skeleton className="h-7 w-full" /><Skeleton className="h-7 w-full" /><Skeleton className="h-7 w-full" /><Skeleton className="hidden h-7 w-full sm:block" /><Skeleton className="hidden h-7 w-full sm:block" /></div>)}</div></Panel>;
            break;
        case "dashboard":
            content = <><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Panel key={i} className="space-y-5"><Skeleton className="h-4 w-24" /><Skeleton className="h-9 w-3/4" /><Skeleton className="h-3 w-1/2" /></Panel>)}</div><div className="grid gap-6 lg:grid-cols-3"><Panel className="lg:col-span-2"><Skeleton className="h-64 w-full sm:h-80" /></Panel><Panel><Skeleton className="h-64 w-full sm:h-80" /></Panel></div></>;
            break;
        case "form":
            content = <div className="grid gap-6 lg:grid-cols-3"><Panel className="space-y-8 lg:col-span-2"><Fields /><Lines count={2} /><Skeleton className="h-28 w-full" /><Skeleton className="h-11 w-40" /></Panel><Panel className="space-y-6"><Skeleton className="h-40 w-full" /><Lines count={4} /></Panel></div>;
            break;
        case "order":
            content = <><Panel className="space-y-5"><Skeleton className="mx-auto h-16 w-16 rounded-full" /><Skeleton className="mx-auto h-7 w-2/3" /><Skeleton className="mx-auto h-4 w-1/2" /></Panel><div className="grid gap-6 lg:grid-cols-3"><Panel className="space-y-7 lg:col-span-2"><Lines count={4} /><Lines count={4} /></Panel><Panel className="space-y-7"><Lines count={4} /><Skeleton className="h-11 w-full" /></Panel></div></>;
            break;
        case "orders":
            content = <div className="space-y-5">{Array.from({ length: 3 }, (_, i) => <Panel key={i} className="flex gap-5"><Skeleton className="h-24 w-24 shrink-0" /><div className="flex-1 space-y-5"><Lines /><Skeleton className="h-9 w-28" /></div></Panel>)}</div>;
            break;
        case "team":
            content = <><Skeleton className="h-64 w-full sm:h-80" /><div className="grid grid-cols-2 gap-6 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Panel key={i} className="space-y-5"><Skeleton className="mx-auto aspect-square w-full max-w-40 rounded-full" /><Lines count={2} /></Panel>)}</div></>;
            break;
        case "builder":
            content = <div className="grid gap-6 md:grid-cols-3"><Panel className="space-y-6"><Lines count={6} /><Fields /></Panel><Panel className="space-y-6 md:col-span-2"><Skeleton className="h-64 w-full" /><Lines count={5} /></Panel></div>;
            break;
        case "promotions":
            content = <div className="grid gap-6 md:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <Panel key={i} className="space-y-6"><Skeleton className="h-44 w-full" /><Lines /><Skeleton className="h-11 w-36" /></Panel>)}</div>;
            break;
        default:
            content = <><Skeleton className="h-56 w-full sm:h-72" /><div className="grid gap-6 md:grid-cols-2"><Panel><Lines count={6} /></Panel><Panel><Lines count={6} /></Panel></div></>;
    }
    return <div role="status" aria-busy="true" aria-live="polite" className={`site-shell py-6 sm:py-8 ${className}`}><span className="sr-only">{label}</span><div aria-hidden="true" className="space-y-6"><div className="space-y-3"><Skeleton className="h-8 w-2/3 max-w-80" /><Skeleton className="h-4 w-1/2 max-w-56" /></div>{content}</div></div>;
}

export default function RouteLoading() {
    const { pathname } = useLocation();
    return <PageLoading variant={loadingVariant(pathname)} />;
}
