import { it } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);

it("retains the modal through exit, handles reopening, and restores focus and scroll after exit", async () => {
    const bundle = await build({
        stdin: { resolveDir: resolve("."), loader: "jsx", contents: `
            import { create, act } from "react-test-renderer";
            import AnimatedDrawer from "./src/Components/AnimatedDrawer.jsx";
            export async function exercise() {
                globalThis.IS_REACT_ACT_ENVIRONMENT = true;
                const saved = { document: globalThis.document, HTMLElement: globalThis.HTMLElement };
                class Element {
                    inert = false;
                    isConnected = true;
                    parentElement = null;
                    children = [];
                    style = {};
                    closest() { return null; }
                    querySelector() { return null; }
                    querySelectorAll() { return []; }
                    hasAttribute(name) { return name === "inert" && this.inert; }
                    setAttribute(name) { if (name === "inert") this.inert = true; }
                    toggleAttribute(name, value) { if (name === "inert") this.inert = value; }
                    focus(options) { document.activeElement = this; this.focusOptions = options; }
                }
                globalThis.HTMLElement = Element;
                const body = new Element(); body.style.overflow = "auto";
                const background = new Element();
                const trigger = new Element();
                const panel = new Element(); panel.parentElement = body;
                body.children = [background, panel];
                const listeners = new Map();
                globalThis.document = { body, activeElement: trigger,
                    addEventListener: (name, callback) => listeners.set(name, callback),
                    removeEventListener: name => listeners.delete(name),
                };
                globalThis.drawerExits = new Set();
                let renderer;
                let closes = 0;
                const view = open => <AnimatedDrawer isOpen={open} label="Test drawer" onClose={() => closes++}><button>Close</button></AnimatedDrawer>;
                try {
                    await act(async () => { renderer = create(view(false), { createNodeMock: element => element.props.role === "dialog" ? panel : null }); });
                    const initiallyClosed = document.body.style.overflow === "auto";
                    await act(async () => { renderer.update(view(true)); });
                    const opened = document.body.style.overflow === "hidden" && background.inert && document.activeElement === panel && panel.focusOptions.preventScroll;
                    let prevented = false;
                    listeners.get("keydown")({ key: "Escape", preventDefault: () => { prevented = true; }, stopPropagation() {} });
                    await act(async () => { renderer.update(view(false)); });
                    const retained = renderer.root.findAllByType("div").filter(node => node.props.role === "dialog").length === 1 && document.body.style.overflow === "hidden" && background.inert;
                    await act(async () => { renderer.update(view(true)); });
                    const reopened = renderer.root.findAllByType("div").filter(node => node.props.role === "dialog").length === 1 && globalThis.drawerExits.size === 0 && background.inert;
                    await act(async () => { renderer.update(view(false)); });
                    await act(async () => { for (const finish of [...globalThis.drawerExits]) finish(); });
                    const cleaned = renderer.root.findAllByType("div").filter(node => node.props.role === "dialog").length === 0 && document.body.style.overflow === "auto" && !background.inert && document.activeElement === trigger && listeners.size === 0;
                    globalThis.drawerReducedMotion = true;
                    await act(async () => { renderer.update(view(true)); });
                    const reducedPanel = renderer.root.findAllByType("div").find(node => node.props.role === "dialog");
                    const reducedMotion = reducedPanel.props.variants.closed.x === 0 && reducedPanel.props.variants.closed.opacity === 0;
                    await act(async () => { renderer.unmount(); });
                    const unmountCleaned = document.body.style.overflow === "auto" && !background.inert && listeners.size === 0;
                    renderer = null;
                    return { initiallyClosed, opened, retained, reopened, cleaned, reducedMotion, unmountCleaned, closes, prevented };
                } finally {
                    await act(async () => { renderer?.unmount(); });
                    globalThis.document = saved.document; globalThis.HTMLElement = saved.HTMLElement;
                    delete globalThis.drawerExits; delete globalThis.drawerReducedMotion;
                }
            }
        ` }, bundle: true, platform: "node", format: "esm", jsx: "automatic", write: false,
        plugins: [{ name: "drawer-test-runtime", setup(plugin) {
            plugin.onResolve({ filter: /^framer-motion$/ }, () => ({ path: "motion", namespace: "drawer-test" }));
            // Real presence lifecycle, with animation completion controlled by the test.
            plugin.onLoad({ filter: /^motion$/, namespace: "drawer-test" }, () => ({ loader: "jsx", resolveDir: resolve("."), contents: `
                import { forwardRef, useEffect } from "react";
                import { AnimatePresence, usePresence } from ${JSON.stringify(pathToFileURL(require.resolve("framer-motion")).href)};
                export { AnimatePresence };
                export const useReducedMotion = () => Boolean(globalThis.drawerReducedMotion);
                const Div = forwardRef(function Div({ children, ...props }, ref) {
                    const [present, complete] = usePresence();
                    useEffect(() => { if (!present && complete) {
                        globalThis.drawerExits.add(complete);
                        return () => globalThis.drawerExits.delete(complete);
                    } }, [present, complete]);
                    return <div {...props} ref={ref}>{children}</div>;
                });
                export const motion = { div: Div };
            ` }));
            plugin.onResolve({ filter: /^react-dom$/ }, () => ({ path: "portal", namespace: "drawer-test" }));
            plugin.onLoad({ filter: /^portal$/, namespace: "drawer-test" }, () => ({ contents: "export const createPortal = children => children;" }));
            plugin.onResolve({ filter: /^(react|react-test-renderer)(\/.*)?$/ }, args => ({ path: args.kind === "require-call" ? require.resolve(args.path) : pathToFileURL(require.resolve(args.path)).href, external: true }));
            plugin.onResolve({ filter: /^file:/ }, args => ({ path: args.path, external: true }));
        } }],
        banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
    });
    const dir = await mkdtemp(join(tmpdir(), "ssi-drawer-lifecycle-"));
    try {
        const file = join(dir, "drawer.mjs"); await writeFile(file, bundle.outputFiles[0].text);
        const { exercise } = await import(pathToFileURL(file).href);
        assert.deepEqual(await exercise(), { initiallyClosed: true, opened: true, retained: true, reopened: true, cleaned: true, reducedMotion: true, unmountCleaned: true, closes: 1, prevented: true });
    } finally { await rm(dir, { recursive: true, force: true }); }
});
