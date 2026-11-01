import { it } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

it("keeps mobile drafts isolated and preserves price input nodes when applying filters", async () => {
    const bundle = await build({
        stdin: { resolveDir: resolve("."), loader: "jsx", contents: `
            import { useState } from "react";
            import { create, act } from "react-test-renderer";
            import { FilterPanel } from "./src/Components/CatalogFilters.jsx";
            import { emptyFilters } from "./src/utils/catalogFilters.js";
            export async function exercise() {
                globalThis.IS_REACT_ACT_ENVIRONMENT = true;
                let applied = emptyFilters();
                function Harness() {
                    const [draft, setDraft] = useState(applied);
                    return <><FilterPanel mobile filters={draft} facets={{ categories: [{ value: "care", label: "Care", count: 2 }] }} onChange={patch => setDraft(prev => ({ ...prev, ...patch }))} /><button id="apply" onClick={() => { applied = draft; }}>Apply</button></>;
                }
                let renderer;
                await act(async () => { renderer = create(<Harness />); });
                const fields = () => renderer.root.findAllByType("input").filter(input => input.props.type === "number");
                const first = fields()[0];
                await act(async () => { first.props.onChange({ target: { value: "75" } }); });
                const stayedMounted = fields()[0] === first;
                const beforeApply = applied.minPrice;
                await act(async () => { fields()[1].props.onChange({ target: { value: "50" } }); });
                const invalid = renderer.root.findAll(node => node.props.role === "alert").length;
                await act(async () => { fields()[1].props.onChange({ target: { value: "100" } }); });
                const category = renderer.root.findAllByType("input").find(input => input.props.type === "checkbox");
                await act(async () => { category.props.onChange({ target: { checked: true } }); });
                await act(async () => { renderer.root.findByProps({ id: "apply" }).props.onClick(); });
                await act(async () => { renderer.unmount(); });
                return { stayedMounted, beforeApply, invalid, applied };
            }
            export async function desktopFocus() {
                globalThis.IS_REACT_ACT_ENVIRONMENT = true;
                function Harness() {
                    const [filters, setFilters] = useState(emptyFilters());
                    return <FilterPanel filters={filters} facets={{ categories: [] }} onChange={patch => setFilters(prev => ({ ...prev, ...patch }))} />;
                }
                let renderer;
                await act(async () => { renderer = create(<Harness />); });
                const field = () => renderer.root.findAllByType("input").find(input => input.props.type === "number");
                const before = field();
                await act(async () => { before.props.onChange({ target: { value: "25" } }); });
                const apply = renderer.root.findAllByType("button").find(button => button.children.includes("Apply price"));
                await act(async () => { apply.props.onClick(); });
                const result = { sameNode: before === field(), price: field().props.value };
                await act(async () => { renderer.unmount(); });
                return result;
            }
        ` }, bundle: true, platform: "node", format: "esm", jsx: "automatic", write: false,
        plugins: [{ name: "native-react-runtime", setup(plugin) {
            plugin.onResolve({ filter: /^(react|react-dom|react-test-renderer)(\/.*)?$/ }, args => ({ path: args.kind === "require-call" ? require.resolve(args.path) : pathToFileURL(require.resolve(args.path)).href, external: true }));
        } }],
        banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
    });
    const dir = await mkdtemp(join(tmpdir(), "ssi-filter-controls-"));
    try {
        const file = join(dir, "controls.mjs"); await writeFile(file, bundle.outputFiles[0].text);
        const { exercise, desktopFocus } = await import(pathToFileURL(file).href);
        const result = await exercise();
        assert.equal(result.stayedMounted, true); assert.equal(result.beforeApply, ""); assert.ok(result.invalid > 0);
        assert.equal(result.applied.minPrice, "75"); assert.equal(result.applied.maxPrice, "100"); assert.deepEqual(result.applied.category, ["care"]);
        assert.deepEqual(await desktopFocus(), { sameNode: true, price: "25" });
    } finally { await rm(dir, { recursive: true, force: true }); }
});
