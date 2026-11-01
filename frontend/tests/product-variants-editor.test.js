import { it } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);

it("preserves variant field identity, edit stock locks, active summaries and deliberate removal", async () => {
    const bundle = await build({ stdin: { resolveDir: resolve("."), loader: "jsx", contents: `
        import { useState } from "react";
        import { create, act } from "react-test-renderer";
        import ProductVariantsEditor from "./src/Components/Admin/ProductVariantsEditor.jsx";
        export async function exercise() {
            globalThis.IS_REACT_ACT_ENVIRONMENT = true;
            const initial = [
                { _id: "first", name: "Small pack", color: "Blue", sku: "SM", price: 100, stock: 4, lowStock: 5, imageIndex: 0, active: true },
                { _id: "second", name: "Large pack", price: 200, stock: 8, lowStock: 5, imageIndex: 1, active: true },
            ];
            let latest, additions = 0;
            function Harness() {
                const [variants, setVariants] = useState(initial);
                latest = variants;
                return <ProductVariantsEditor isEditing variants={variants} images={["first.webp", "second.webp"]}
                    onAdd={() => { additions++; setVariants(prev => [...prev, { _editorKey: "new", name: "New pack", price: 50, stock: 0, lowStock: 5, active: true, imageIndex: 0, imageIndices: [] }]); }}
                    onChange={(index, key, value) => setVariants(prev => prev.map((item, at) => at === index ? { ...item, [key]: value } : item))}
                    onRemove={index => setVariants(prev => prev.filter((_, at) => at !== index))} />;
            }
            let renderer;
            try {
                await act(async () => { renderer = create(<Harness />); });
                const rows = () => renderer.root.findAllByType("fieldset").filter(node => node.props.className?.includes("bg-white"));
                const field = (row, key) => rows()[row].findAllByType("input").find(node => node.props.id?.endsWith("-" + key));
                const button = (row, label) => rows()[row].findAllByType("button").find(node => node.children.includes(label));
                const secondName = field(1, "name");
                const initialPictures = rows()[0].findAllByType("input").filter(node => node.props["aria-label"]?.startsWith("Image "));
                const takenHidden = initialPictures.length === 1 && initialPictures[0].props["aria-label"].startsWith("Image 1 ");
                const lockedStock = field(0, "stock").props.readOnly && field(1, "stock").props.readOnly;
                const ids = renderer.root.findAllByType("input").map(node => node.props.id).filter(Boolean);
                const labels = renderer.root.findAllByType("label").map(node => node.props.htmlFor).filter(Boolean);
                const labeled = new Set(ids).size === ids.length && ids.every(id => labels.includes(id));
                await act(async () => { field(1, "name").props.onChange({ target: { value: "Large refill" } }); });
                const sameInput = field(1, "name") === secondName;
                await act(async () => { rows()[1].findAllByType("input").find(node => node.props.type === "checkbox").props.onChange({ target: { checked: false } }); });
                const activeSummary = renderer.root.findAllByType("span").some(node => node.children.join("") === "1 of 2 active");
                await act(async () => { button(0, "Remove variant").props.onClick(); });
                const pending = latest.length === 2;
                await act(async () => { button(0, "Keep variant").props.onClick(); });
                const canceled = latest.length === 2 && !rows()[0].findAllByProps({ role: "group" }).length;
                await act(async () => { button(0, "Remove variant").props.onClick(); });
                await act(async () => { button(0, "Confirm removal").props.onClick(); });
                const preservedAfterRemove = field(0, "name") === secondName && latest[0]._id === "second" && latest[0].name === "Large refill";
                await act(async () => { renderer.root.findAllByType("button").find(node => node.children.includes("Add variant")).props.onClick(); });
                const newStockEditable = !field(1, "stock").props.readOnly && field(1, "name").props.autoFocus;
                const pictures = () => rows()[0].findAllByType("input").filter(node => node.props["aria-label"]?.startsWith("Image "));
                const selectedImage = pictures()[1].props.checked && !pictures()[0].props.checked;
                await act(async () => { pictures()[0].props.onChange({ target: { checked: true } }); });
                const multipleImages = pictures().every(node => node.props.checked) && latest[0].imageIndices.join(",") === "1,0";
                return { takenHidden, lockedStock, labeled, sameInput, activeSummary, pending, canceled, preservedAfterRemove, newStockEditable, selectedImage, multipleImages, additions };
            } finally { await act(async () => { renderer?.unmount(); }); }
        }
    ` }, bundle: true, platform: "node", format: "esm", jsx: "automatic", write: false,
        plugins: [{ name: "native-react-runtime", setup(plugin) {
            plugin.onResolve({ filter: /^(react|react-dom|react-test-renderer)(\/.*)?$/ }, args => ({ path: args.kind === "require-call" ? require.resolve(args.path) : pathToFileURL(require.resolve(args.path)).href, external: true }));
        } }], banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
    });
    const dir = await mkdtemp(join(tmpdir(), "ssi-variant-editor-"));
    try {
        const file = join(dir, "variants.mjs"); await writeFile(file, bundle.outputFiles[0].text);
        const { exercise } = await import(pathToFileURL(file).href);
        assert.deepEqual(await exercise(), { takenHidden: true, lockedStock: true, labeled: true, sameInput: true, activeSummary: true, pending: true, canceled: true, preservedAfterRemove: true, newStockEditable: true, selectedImage: true, multipleImages: true, additions: 1 });
    } finally { await rm(dir, { recursive: true, force: true }); }
});
