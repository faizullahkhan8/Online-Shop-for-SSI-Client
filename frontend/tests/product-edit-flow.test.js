import { it } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);

it("loads fresh edit data by ID, protects drafts, saves revisions and handles route changes and errors", async () => {
    const output = await build({ stdin: { resolveDir: resolve("."), loader: "jsx", contents: `
        import { create, act } from "react-test-renderer";
        import { MemoryRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
        import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
        import AddProduct from "./src/Pages/Admin/AddProductPage.jsx";
        export async function exercise() {
            globalThis.IS_REACT_ACT_ENVIRONMENT = true;
            const ids = ["000000000000000000000011", "000000000000000000000012", "000000000000000000000013", "000000000000000000000014"];
            const makeProduct = (id, name, revision = 0) => ({ _id: id, name, revision, slug: "product", category: "000000000000000000000001", vendor: "", price: 100, lowStock: 5, stock: 10,
                image: null, images: [], variants: [{ _id: "000000000000000000000020", name: "Pack", price: 100, stock: 10, lowStock: 5, imageIndex: 0, active: true }], details: [], badges: [] });
            const requests = [], saves = [];
            let aborts = 0;
            globalThis.productEditTestGet = (url, options) => new Promise((resolve, reject) => {
                requests.push({ url, resolve: product => resolve({ data: { success: true, product } }), reject });
                options.signal.addEventListener("abort", () => { aborts++; reject(new Error("aborted")); }, { once: true });
            });
            globalThis.productEditTestPatch = async (url, form) => { saves.push({ url, payload: JSON.parse(form.get("data")) }); return { data: { success: true } }; };
            const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity }, mutations: { retry: false } } });
            client.setQueryData(["products", "admin-edit", ids[0]], { product: makeProduct(ids[0], "Stale cached name") });
            let go, path, renderer;
            function Router() {
                go = useNavigate(); path = useLocation().pathname;
                return <Routes><Route path="/admin-dashboard/products/:id/edit" element={<AddProduct />} /><Route path="/admin-dashboard/products/add" element={<AddProduct />} /><Route path="/admin-dashboard/products" element={<p>Products list</p>} /></Routes>;
            }
            const pause = () => new Promise(resolve => setTimeout(resolve, 25));
            const settle = async product => { await act(async () => { requests.at(-1).resolve(product); await pause(); }); };
            const field = id => renderer.root.findAllByType("input").find(node => node.props.id === id);
            const editUrl = id => "/admin-dashboard/products/" + id + "/edit";
            try {
                await act(async () => { renderer = create(<QueryClientProvider client={client}><MemoryRouter initialEntries={[editUrl(ids[0])]}><Router /></MemoryRouter></QueryClientProvider>); });
                const holdsCachedData = !field("name") && requests[0].url === "/products/admin/" + ids[0] + "/edit";
                await settle(makeProduct(ids[0], "Fresh name"));
                const freshLoaded = field("name").props.value === "Fresh name";
                await act(async () => { field("name").props.onChange({ target: { id: "name", value: "Unsaved draft" } }); });
                await act(async () => { void client.invalidateQueries({ queryKey: ["products"] }); });
                await settle(makeProduct(ids[0], "Background change", 1));
                const draftPreserved = field("name").props.value === "Unsaved draft";
                let reload;
                await act(async () => { reload = renderer.root.findAllByType("button").find(node => node.children.includes("Reload saved product (discard unsaved edits)")).props.onClick(); });
                await settle(makeProduct(ids[0], "Reloaded name", 2));
                await act(async () => { await reload; });
                const reloaded = field("name").props.value === "Reloaded name";
                await act(async () => { field("name").props.onChange({ target: { id: "name", value: "Saved name" } }); });
                await act(async () => { await renderer.root.findAllByType("form").at(-1).props.onSubmit({ preventDefault() {} }); await pause(); });
                const saved = saves[0].url.endsWith(ids[0]) && saves[0].payload.name === "Saved name" && saves[0].payload.revision === 2 && !("stock" in saves[0].payload) && !("stock" in saves[0].payload.variants[0]) && path === "/admin-dashboard/products";
                await act(async () => { go(editUrl(ids[1])); });
                await act(async () => { go(editUrl(ids[2])); });
                await settle(makeProduct(ids[2], "Third product"));
                const routeIsolation = aborts > 0 && field("name").props.value === "Third product";
                await act(async () => { go("/admin-dashboard/products/add"); });
                const addIsBlank = field("name").props.value === "";
                const upload = () => renderer.root.findAllByType("input").find(node => node.props.type === "file");
                const multiSelectVisible = upload().props.multiple && renderer.root.findAllByType("button").some(node => node.findAllByType("span").some(span => span.children.includes("Choose images")));
                const image = name => new File(["synthetic test image"], name, { type: "image/png" });
                await act(async () => { upload().props.onChange({ target: { type: "file", files: [image("one.png"), image("two.png")], value: "selection" } }); });
                await act(async () => { upload().props.onChange({ target: { type: "file", files: [image("three.png")], value: "selection" } }); });
                const imagesAppend = renderer.root.findAllByType("figcaption").length === 3;
                await act(async () => { upload().props.onChange({ target: { type: "file", files: [image("four.png"), image("five.png"), image("six.png")], value: "selection" } }); });
                const uploadLimitGuard = renderer.root.findAllByType("figcaption").length === 3;
                const old = new URLSearchParams({ isEditing: "true", product: JSON.stringify({ _id: ids[0], name: "Injected URL name", price: 1 }) });
                await act(async () => { go("/admin-dashboard/products/add?" + old); });
                await settle(makeProduct(ids[0], "Server wins"));
                const legacySafe = path === editUrl(ids[0]) && field("name").props.value === "Server wins";
                const beforeInvalid = requests.length;
                await act(async () => { go(editUrl("invalid")); });
                const invalidSafe = requests.length === beforeInvalid && renderer.root.findAllByProps({ role: "alert" }).length > 0;
                await act(async () => { go(editUrl(ids[3])); });
                await act(async () => { requests.at(-1).reject({ response: { status: 404, data: { message: "Product not found" } } }); await pause(); });
                const errorSafe = !field("name") && renderer.root.findAllByProps({ role: "alert" }).length > 0;
                await act(async () => { renderer.root.findAllByType("button").find(node => node.children.includes("Try again")).props.onClick(); });
                await settle(makeProduct(ids[3], "Recovered product"));
                const recovered = field("name").props.value === "Recovered product";
                return { holdsCachedData, freshLoaded, draftPreserved, reloaded, saved, routeIsolation, addIsBlank, multiSelectVisible, imagesAppend, uploadLimitGuard, legacySafe, invalidSafe, errorSafe, recovered };
            } finally { await act(async () => { renderer?.unmount(); }); client.clear(); delete globalThis.productEditTestGet; delete globalThis.productEditTestPatch; }
        }
    ` }, bundle: true, platform: "node", format: "esm", jsx: "automatic", write: false,
        plugins: [{ name: "edit-flow-test-boundaries", setup(plugin) {
            plugin.onResolve({ filter: /^(react|react-dom|react-test-renderer)(\/.*)?$/ }, args => ({ path: args.kind === "require-call" ? require.resolve(args.path) : pathToFileURL(require.resolve(args.path)).href, external: true }));
            plugin.onResolve({ filter: /apiClient(\.js)?$/ }, () => ({ path: "api", namespace: "edit-test" }));
            plugin.onResolve({ filter: /hooks\/(category|vendor)\.api\.js$/ }, args => ({ path: args.path.includes("category") ? "categories" : "vendors", namespace: "edit-test" }));
            plugin.onResolve({ filter: /ProductDetailsBuilder\.jsx$/ }, () => ({ path: "details", namespace: "edit-test" }));
            plugin.onResolve({ filter: /^react-toastify$/ }, () => ({ path: "toast", namespace: "edit-test" }));
            plugin.onLoad({ filter: /.*/, namespace: "edit-test" }, args => ({ contents: args.path === "api" ? `export default { get: (...args) => globalThis.productEditTestGet(...args), patch: (...args) => globalThis.productEditTestPatch(...args) };`
                : args.path === "categories" ? 'const data = { categories: [] }; export const useGetAllCategories = () => ({ data, loading: false });'
                : args.path === "vendors" ? 'const data = { success: true, vendors: [] }; export const useGetAllVendors = () => ({ data, loading: false });'
                : args.path === "toast" ? 'export const toast = { success() {}, error() {} };'
                : 'export default function Details() { return null; }' }));
        } }], banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
    });
    const dir = await mkdtemp(join(tmpdir(), "ssi-product-edit-flow-"));
    try {
        const file = join(dir, "editor.mjs"); await writeFile(file, output.outputFiles[0].text);
        const { exercise } = await import(pathToFileURL(file).href);
        assert.deepEqual(await exercise(), { holdsCachedData: true, freshLoaded: true, draftPreserved: true, reloaded: true, saved: true, routeIsolation: true, addIsBlank: true, multiSelectVisible: true, imagesAppend: true, uploadLimitGuard: true, legacySafe: true, invalidSafe: true, errorSafe: true, recovered: true });
    } finally { await rm(dir, { recursive: true, force: true }); }
});
