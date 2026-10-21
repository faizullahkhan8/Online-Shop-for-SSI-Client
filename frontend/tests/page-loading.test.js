import { it } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Compile JSX for Node and render the actual components without browser control.
const output = await build({
    stdin: {
        contents: `import { renderToStaticMarkup } from "react-dom/server";
            import { MemoryRouter } from "react-router-dom";
            import RouteLoading, { PageLoading, loadingVariant } from "./src/Components/UI/PageLoading.jsx";
            export { loadingVariant };
            export const render = variant => renderToStaticMarkup(<PageLoading variant={variant} />);
            export const renderRoute = path => renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><RouteLoading /></MemoryRouter>);`,
        resolveDir: resolve("."), loader: "jsx",
    },
    bundle: true, platform: "node", format: "esm", jsx: "automatic", write: false,
    banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
});
const dir = await mkdtemp(join(tmpdir(), "store-loading-"));
let loading;
try {
    const file = join(dir, "render.mjs");
    await writeFile(file, output.outputFiles[0].text);
    loading = await import(pathToFileURL(file).href);
} finally {
    await rm(dir, { recursive: true, force: true });
}

it("renders every skeleton with one busy announcement and no interactive placeholders", () => {
    for (const variant of ["home", "catalog", "product", "table", "dashboard", "form", "order", "orders", "team", "builder", "promotions", "content"]) {
        const html = loading.render(variant);
        assert.equal((html.match(/role="status"/g) || []).length, 1, variant);
        assert.match(html, /aria-busy="true"/);
        assert.match(html, /aria-hidden="true"/);
        assert.match(html, /motion-reduce:animate-none/);
        assert.doesNotMatch(html, /<(button|input|select|textarea|a)\b/);
        assert.doesNotMatch(html, /animate-spin/);
    }
});

it("chooses loading layouts for customer and admin navigation", () => {
    for (const [path, variant] of Object.entries({
        "/": "home", "/products": "catalog", "/wishlist": "catalog",
        "/product/123": "product", "/orders": "orders", "/orders/success": "order",
        "/checkout": "form", "/our-team": "team", "/about-us": "content",
        "/admin-dashboard": "dashboard", "/admin-dashboard/products": "table",
        "/admin-dashboard/orders/123": "order", "/admin-dashboard/settings": "form",
        "/admin-dashboard/orders/add": "form", "/admin-dashboard/promotions": "promotions",
        "/admin-dashboard/home-page-builder": "builder",
    })) assert.equal(loading.loadingVariant(path), variant, path);
    assert.match(loading.renderRoute("/products"), /aria-busy="true"/);
});
