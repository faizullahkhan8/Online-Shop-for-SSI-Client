import { it } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);

it("previews safe stock changes, guards double submits and preserves request identity for uncertain outcomes", async () => {
    const output = await build({ stdin: { resolveDir: resolve("."), loader: "jsx", contents: `
        import { create, act } from "react-test-renderer";
        import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
        import { MemoryRouter } from "react-router-dom";
        import ProductsList from "./src/Pages/Admin/ProductsListPage.jsx";
        import Panel from "./src/Components/Admin/StockAdjustmentPanel.jsx";
        export async function restoreConfirmation() {
            globalThis.IS_REACT_ACT_ENVIRONMENT = true;
            const previousDocument = globalThis.document;
            globalThis.document = { body: {} };
            const archived = { _id: "000000000000000000000010", name: "Archived product", price: 100, stock: 10, isArchived: true };
            let calls = 0, resolvePost, rejectPost, restored = false;
            globalThis.stockTestGet = async () => ({ data: { success: true, products: restored ? [] : [archived], totalPages: 1 } });
            globalThis.stockTestPost = () => { calls++; return new Promise((resolve, reject) => { resolvePost = resolve; rejectPost = reject; }); };
            const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
            const pause = () => new Promise(resolve => setTimeout(resolve, 30));
            let renderer;
            const button = text => renderer.root.findAllByType("button").find(node => node.children.includes(text));
            const dialogs = () => renderer.root.findAllByType("div").filter(node => node.props.role === "dialog");
            try {
                await act(async () => { renderer = create(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/admin-dashboard/products?archived=1"]}><ProductsList /></MemoryRouter></QueryClientProvider>); });
                await act(async () => { await pause(); });
                await act(async () => { button("Restore").props.onClick(); });
                const asksFirst = calls === 0 && dialogs().length === 1 && dialogs()[0].props["aria-label"] === "Restore Product";
                await act(async () => { button("Cancel").props.onClick(); });
                const cancelSafe = calls === 0 && dialogs().length === 0;
                await act(async () => { button("Restore").props.onClick(); });
                let attempt;
                await act(async () => { const confirm = button("Restore product"); attempt = confirm.props.onClick(); void confirm.props.onClick(); });
                await act(async () => { await pause(); });
                const guarded = calls === 1 && renderer.root.findAllByType("button").find(node => node.props["aria-label"] === "Close confirmation dialog").props.disabled;
                await act(async () => { rejectPost({ response: { status: 503, data: { message: "Try again" } } }); await attempt; });
                await act(async () => { await pause(); });
                const retryAvailable = dialogs().length === 1 && !button("Restore product").props.disabled;
                await act(async () => { attempt = button("Restore product").props.onClick(); });
                await act(async () => { restored = true; resolvePost({ data: { success: true } }); await attempt; await pause(); });
                const confirmed = calls === 2 && dialogs().length === 0 && !button("Restore");
                return { asksFirst, cancelSafe, guarded, retryAvailable, confirmed };
            } finally { await act(async () => { renderer?.unmount(); }); client.clear(); globalThis.document = previousDocument; delete globalThis.stockTestGet; delete globalThis.stockTestPost; }
        }
        export async function integration() {
            globalThis.IS_REACT_ACT_ENVIRONMENT = true;
            const previousDocument = globalThis.document;
            globalThis.document = { body: {} };
            let inventory = { _id: "000000000000000000000010", name: "Listed product", price: 100, stock: 10, revision: 1, variants: [], images: [] };
            const urls = []; let posted;
            globalThis.stockTestGet = async url => {
                urls.push(url);
                return { data: url === "/products/all" ? { success: true, products: [inventory], totalPages: 1 } : { success: true, product: { ...inventory, stock: 15 } } };
            };
            globalThis.stockTestPost = async (url, body) => { posted = { url, body }; inventory = { ...inventory, stock: 20, revision: 2 }; return { data: { success: true, product: inventory } }; };
            const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
            const pause = () => new Promise(resolve => setTimeout(resolve, 30));
            let renderer;
            try {
                await act(async () => { renderer = create(<QueryClientProvider client={client}><MemoryRouter><ProductsList /></MemoryRouter></QueryClientProvider>); });
                await act(async () => { await pause(); });
                const action = renderer.root.findAllByType("button").find(node => node.props["aria-label"] === "Adjust stock for Listed product");
                await act(async () => { action.props.onClick(); });
                await act(async () => { await pause(); });
                const dialog = renderer.root.findAllByType("div").find(node => node.props.role === "dialog");
                const opensFresh = Boolean(dialog) && urls.includes("/products/admin/000000000000000000000010/edit") && dialog.findAllByType("strong").some(node => node.children.join("") === "15");
                await act(async () => {
                    dialog.findAllByType("input").find(node => node.props.type === "number").props.onChange({ target: { value: "5" } });
                    dialog.findByType("textarea").props.onChange({ target: { value: "Supplier delivery" } });
                });
                await act(async () => { await dialog.findByType("form").props.onSubmit({ preventDefault() {} }); await pause(); });
                const closesOnSuccess = renderer.root.findAllByType("div").every(node => node.props.role !== "dialog");
                const updatedList = renderer.root.findAllByType("td").some(node => node.findAllByType("span").some(span => span.children.join("") === "20"));
                const correctPost = posted.url.endsWith("/stock-adjustments") && posted.body.delta === 5 && posted.body.expectedRevision === 1;
                return { opensFresh, closesOnSuccess, updatedList, correctPost };
            } finally { await act(async () => { renderer?.unmount(); }); client.clear(); globalThis.document = previousDocument; delete globalThis.stockTestGet; delete globalThis.stockTestPost; }
        }
        export async function exercise() {
            globalThis.IS_REACT_ACT_ENVIRONMENT = true;
            const base = { _id: "000000000000000000000001", name: "Product", stock: 10, revision: 2, variants: [] };
            const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
            const requests = [];
            let handler, renderer, current = base, scenario = "simple", adjusted = 0, locked = false;
            globalThis.stockTestPost = (url, body, options) => { requests.push({ url, body, key: options.headers["Idempotency-Key"] }); return handler(); };
            const render = () => <QueryClientProvider client={client}><Panel key={scenario} product={current} onAdjusted={() => adjusted++}
                onLockChange={value => { locked = value; }} onReload={async () => { current = { ...base, stock: 20, revision: 7 }; renderer.update(render()); return { data: { product: current } }; }} /></QueryClientProvider>;
            const fields = () => renderer.root.findAllByType("input");
            const form = () => renderer.root.findByType("form");
            const submitButton = () => renderer.root.findAllByType("button").find(node => !node.props.type);
            const fill = async (quantity, reason = "Supplier delivery") => { await act(async () => { fields()[0].props.onChange({ target: { value: quantity } }); renderer.root.findByType("textarea").props.onChange({ target: { value: reason } }); }); };
            const submit = () => form().props.onSubmit({ preventDefault() {} });
            try {
                await act(async () => { renderer = create(render()); });
                await fill("-11");
                await act(async () => { await submit(); });
                const negativeBlocked = submitButton().props.disabled && requests.length === 0;
                await fill("0"); const zeroBlocked = submitButton().props.disabled;
                await fill("1.5"); const fractionalBlocked = submitButton().props.disabled;
                await fill("5");
                const preview = renderer.root.findAllByType("p").some(node => node.children.join("") === "15");
                let resolvePost, first;
                handler = () => new Promise(resolve => { resolvePost = resolve; });
                await act(async () => { first = submit(); void submit(); });
                const guarded = requests.length === 1 && locked;
                await act(async () => { resolvePost({ data: { success: true, product: { ...base, stock: 15, revision: 3 } } }); await first; });
                const confirmed = adjusted === 1 && !locked;

                scenario = "uncertain"; current = base;
                await act(async () => { renderer.update(render()); });
                await fill("2"); handler = async () => { throw { response: { status: 503 } }; };
                await act(async () => { await submit(); });
                const original = requests.at(-1);
                const uncertainFrozen = locked && fields()[0].props.disabled && submitButton().children.includes("Check adjustment result");
                current = { ...base, stock: 12, revision: 3 };
                await act(async () => { renderer.update(render()); });
                handler = async () => ({ data: { success: true, product: current } });
                await act(async () => { await submit(); });
                const retry = requests.at(-1);
                const sameRequest = original.key === retry.key && JSON.stringify(original.body) === JSON.stringify(retry.body) && retry.body.expectedRevision === 2 && adjusted === 2 && !locked;

                scenario = "conflict"; current = base;
                await act(async () => { renderer.update(render()); });
                await fill("3"); handler = async () => { throw { response: { status: 409, data: { message: "Inventory changed" } } }; };
                await act(async () => { await submit(); });
                const refusedKey = requests.at(-1).key;
                const conflictBlocked = submitButton().props.disabled;
                await act(async () => { await renderer.root.findAllByType("button").find(node => node.children.includes("Reload current stock")).props.onClick(); });
                const draftRetained = fields()[0].props.value === "3" && renderer.root.findByType("textarea").props.value === "Supplier delivery";
                handler = async () => ({ data: { success: true, product: { ...current, stock: 23, revision: 8 } } });
                await act(async () => { await submit(); });
                const freshRevision = requests.at(-1).body.expectedRevision === 7 && requests.at(-1).key !== refusedKey;

                scenario = "variant"; current = { ...base, variants: [{ _id: "v1", name: "Small", stock: 4, active: true }, { _id: "v2", name: "Large", stock: 6, active: true }] };
                await act(async () => { renderer.update(render()); });
                await fill("-5");
                const requiresVariant = submitButton().props.disabled;
                await act(async () => { renderer.root.findByType("select").props.onChange({ target: { value: "v1" } }); });
                const variantBalanceGuard = submitButton().props.disabled;
                await fill("2");
                handler = async () => ({ data: { success: true, product: current } });
                await act(async () => { await submit(); });
                const variantTarget = requests.at(-1).body.variantId === "v1";
                scenario = "shared"; current = { ...base, variants: [{ _id: "v1", name: "Small", stock: 0, active: true }] };
                await act(async () => { renderer.update(render()); });
                const sharedBalance = renderer.root.findAllByType("select").length === 0;
                return { negativeBlocked, zeroBlocked, fractionalBlocked, preview, guarded, confirmed, uncertainFrozen, sameRequest, conflictBlocked, draftRetained, freshRevision, requiresVariant, variantBalanceGuard, variantTarget, sharedBalance };
            } finally { await act(async () => { renderer?.unmount(); }); client.clear(); delete globalThis.stockTestPost; }
        }
    ` }, bundle: true, platform: "node", format: "esm", jsx: "automatic", write: false, define: { "import.meta.env": '{"VITE_IMAGEKIT_URL_ENDPOINT":""}' },
        plugins: [{ name: "stock-test-runtime", setup(plugin) {
            plugin.onResolve({ filter: /^react-dom$/ }, () => ({ path: "portal", namespace: "stock-mock" }));
            plugin.onResolve({ filter: /^framer-motion$/ }, () => ({ path: "motion", namespace: "stock-mock" }));
            plugin.onResolve({ filter: /hooks\/useDialog$/ }, () => ({ path: "dialog", namespace: "stock-mock" }));
            plugin.onResolve({ filter: /^react-toastify$/ }, () => ({ path: "toast", namespace: "stock-mock" }));
            plugin.onLoad({ filter: /.*/, namespace: "stock-mock" }, args => ({ loader: "jsx", contents: args.path === "portal" ? 'export const createPortal = children => children;'
                : args.path === "dialog" ? 'export const useDialog = () => {};'
                : args.path === "toast" ? 'export const toast = { success() {}, error() {} };'
                : 'import { forwardRef } from "react"; const Div = forwardRef(function Div({ children, ...props }, ref) { return <div {...props} ref={ref}>{children}</div>; }); export const motion = { div: Div }; export const AnimatePresence = ({ children }) => children; export const useReducedMotion = () => false;' }));
            plugin.onResolve({ filter: /^(react|react-dom|react-test-renderer)(\/.*)?$/ }, args => ({ path: args.kind === "require-call" ? require.resolve(args.path) : pathToFileURL(require.resolve(args.path)).href, external: true }));
            plugin.onResolve({ filter: /apiClient$/ }, () => ({ path: "api", namespace: "stock-test" }));
            plugin.onLoad({ filter: /.*/, namespace: "stock-test" }, () => ({ contents: "export default { get: (...args) => globalThis.stockTestGet(...args), post: (...args) => globalThis.stockTestPost(...args) };" }));
        } }], banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
    });
    const dir = await mkdtemp(join(tmpdir(), "ssi-stock-modal-"));
    try {
        const file = join(dir, "stock.mjs"); await writeFile(file, output.outputFiles[0].text);
        const { exercise, integration, restoreConfirmation } = await import(pathToFileURL(file).href);
        const result = await exercise();
        for (const [name, passed] of Object.entries(result)) assert.equal(passed, true, name);
        for (const [name, passed] of Object.entries(await integration())) assert.equal(passed, true, name);
        for (const [name, passed] of Object.entries(await restoreConfirmation())) assert.equal(passed, true, name);
    } finally { await rm(dir, { recursive: true, force: true }); }
});
