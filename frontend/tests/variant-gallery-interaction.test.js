import { it } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);

it("browses only the selected variant images, resets on switching and keeps the cart main image", async () => {
    const bundle = await build({ stdin: { resolveDir: resolve("."), loader: "jsx", contents: `
        import { create, act } from "react-test-renderer";
        import { MemoryRouter } from "react-router-dom";
        import ProductDetail from "./src/Pages/ProductDetailPage.jsx";
        export async function exercise() {
            globalThis.IS_REACT_ACT_ENVIRONMENT = true;
            globalThis.variantGalleryProduct = { _id: "p1", name: "Gallery product", price: 100, stock: 10, category: { name: "Care" }, images: [0, 1, 2, 3].map(index => ({ url: "https://example.test/" + index, filePath: "image-" + index })), variants: [
                { _id: "blue", name: "Blue", stock: 5, price: 100, imageIndex: 0, imageIndices: [0, 1] },
                { _id: "red", name: "Red", stock: 5, price: 100, imageIndex: 2, imageIndices: [2, 3] }
            ] };
            let renderer;
            try {
                await act(async () => { renderer = create(<MemoryRouter><ProductDetail /></MemoryRouter>); });
                const main = () => renderer.root.findAllByType("img").find(node => node.props.alt === "Gallery product").props.src;
                const thumbnails = () => renderer.root.findAllByType("button").filter(node => node.props["aria-label"]?.startsWith("View image"));
                const initial = main() === "https://example.test/0" && thumbnails().length === 2;
                await act(async () => { thumbnails()[1].props.onClick(); });
                const browses = main() === "https://example.test/1";
                const red = renderer.root.findAllByType("button").find(node => node.findAllByType("span").some(span => span.children.includes("Red")));
                await act(async () => { red.props.onClick(); });
                const switches = main() === "https://example.test/2" && thumbnails().length === 2;
                await act(async () => { thumbnails()[1].props.onClick(); });
                const redBrowses = main() === "https://example.test/3";
                await act(async () => { renderer.root.findAllByType("button").find(node => node.children.includes("ADD TO CART")).props.onClick(); });
                const cartMain = globalThis.variantGalleryAction.payload.image === "image-2" && globalThis.variantGalleryAction.payload.variantId === "red";
                return { initial, browses, switches, redBrowses, cartMain };
            } finally { await act(async () => { renderer?.unmount(); }); delete globalThis.variantGalleryProduct; delete globalThis.variantGalleryAction; }
        }
    ` }, bundle: true, platform: "node", format: "esm", jsx: "automatic", write: false, define: { "import.meta.env": "{}" },
        plugins: [{ name: "gallery-test-boundaries", setup(plugin) {
            plugin.onResolve({ filter: /^(react|react-dom|react-test-renderer)(\/.*)?$/ }, args => ({ path: args.kind === "require-call" ? require.resolve(args.path) : pathToFileURL(require.resolve(args.path)).href, external: true }));
            plugin.onResolve({ filter: /hooks\/(product|review|user)\.api$/ }, args => ({ path: args.path.includes("product") ? "product" : args.path.includes("review") ? "review" : "user", namespace: "gallery-test" }));
            plugin.onResolve({ filter: /utils\/safeHtml$/ }, () => ({ path: "html", namespace: "gallery-test" }));
            plugin.onResolve({ filter: /Components\/ProductCard$/ }, () => ({ path: "card", namespace: "gallery-test" }));
            plugin.onResolve({ filter: /^react-redux$/ }, () => ({ path: "redux", namespace: "gallery-test" }));
            plugin.onResolve({ filter: /^react-toastify$/ }, () => ({ path: "toast", namespace: "gallery-test" }));
            plugin.onLoad({ filter: /.*/, namespace: "gallery-test" }, args => ({ contents: args.path === "product" ? 'export const useGetProductById = () => ({ data: { product: globalThis.variantGalleryProduct }, loading: false }); export const useGetAllProducts = () => ({ data: { products: [] } });'
                : args.path === "review" ? 'export const useGetProductReviews = () => ({ reviews: [], loading: false }); export const useAddReview = () => ({ addReview() {}, loading: false });'
                : args.path === "user" ? 'export const useGetWishlist = () => ({ data: { wishlist: [] } }); export const useAddToWishlist = () => ({ addToWishlist() {} }); export const useRemoveFromWishlist = () => ({ removeFromWishlist() {} });'
                : args.path === "redux" ? 'export const useSelector = select => select({ auth: { user: null }, cart: { items: [] } }); export const useDispatch = () => action => { globalThis.variantGalleryAction = action; };'
                : args.path === "toast" ? 'export const toast = { success() {}, error() {} };'
                : args.path === "html" ? 'export const safeHtml = () => "";'
                : 'export default function Card() { return null; }' }));
        } }], banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
    });
    const dir = await mkdtemp(join(tmpdir(), "ssi-variant-gallery-"));
    try {
        const file = join(dir, "gallery.mjs"); await writeFile(file, bundle.outputFiles[0].text);
        const { exercise } = await import(pathToFileURL(file).href);
        assert.deepEqual(await exercise(), { initial: true, browses: true, switches: true, redBrowses: true, cartMain: true });
    } finally { await rm(dir, { recursive: true, force: true }); }
});
