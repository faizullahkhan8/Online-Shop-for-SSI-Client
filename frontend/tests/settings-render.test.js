import { it } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// Render both actual settings entry points; isolate network hooks and the map.
const bundle = await build({
    stdin: { resolveDir: resolve("."), loader: "jsx", contents: `
        import { create, act } from "react-test-renderer";
        import { renderToStaticMarkup } from "react-dom/server";
        import { MemoryRouter } from "react-router-dom";
        import SettingsPage from "./src/Pages/Admin/SettingsPage.jsx";
        import TaxShippingPage from "./src/Pages/Admin/TaxShippingPage.jsx";
        export async function interactions() {
            globalThis.IS_REACT_ACT_ENVIRONMENT = true;
            globalThis.settingsRenderState = "loaded";
            let renderer;
            try {
                await act(async () => { renderer = create(<MemoryRouter initialEntries={["/admin-dashboard/settings"]}><SettingsPage /></MemoryRouter>); });
                const tabs = () => renderer.root.findAllByType("button").filter(node => node.props.role === "tab");
                const panel = key => renderer.root.findAllByType("div").find(node => node.props.role === "tabpanel" && node.props.id.endsWith("-" + key));
                const input = key => panel(key).findAllByType("input")[0];
                await act(async () => { input("tax").props.onChange({ target: { value: "125" } }); });
                await act(async () => { tabs()[1].props.onClick(); });
                await act(async () => { input("shipping").props.onChange({ target: { value: "250" } }); });
                const radiusToggle = panel("shipping").findAllByType("input").find(node => node.props.type === "checkbox");
                await act(async () => { radiusToggle.props.onChange({ target: { checked: true } }); });
                const radiusInput = panel("shipping").findAllByType("input").find(node => node.props.min === "0.01");
                const defaultRadius = radiusInput.props.value === 3;
                await act(async () => { radiusInput.props.onChange({ target: { value: "5" } }); });
                const radiusPreview = renderer.root.findAllByType("div").some(node => node.props["data-map-radius"] === 5);
                await act(async () => { tabs()[2].props.onClick(); });
                const add = panel("payments").findAllByType("button").find(node => node.children.some(child => typeof child === "string" && child.trim() === "Add Method"));
                await act(async () => { add.props.onClick(); });
                await act(async () => { input("payments").props.onChange({ target: { value: "Bank Transfer" } }); });
                let focused = -1;
                let prevented = false;
                const event = key => ({ key, preventDefault: () => { prevented = true; }, currentTarget: { parentElement: { querySelectorAll: () => tabs().map((_, index) => ({ focus: () => { focused = index; } })) } } });
                await act(async () => { tabs()[2].props.onKeyDown(event("End")); });
                const endSelected = tabs()[3].props["aria-selected"] && focused === 3;
                await act(async () => { tabs()[3].props.onKeyDown(event("ArrowRight")); });
                const wrapped = tabs()[0].props["aria-selected"] && focused === 0;
                await act(async () => { tabs()[0].props.onKeyDown(event("ArrowLeft")); });
                const reverseWrapped = tabs()[3].props["aria-selected"];
                await act(async () => { tabs()[3].props.onKeyDown(event("Home")); });
                const homeSelected = tabs()[0].props["aria-selected"];
                await act(async () => { renderer.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
                return { preserved: input("tax").props.value === 125 && input("shipping").props.value === 250,
                    defaultRadius, radiusPreview, singlePanel: renderer.root.findAllByType("div").filter(node => node.props.role === "tabpanel" && !node.props.hidden).length === 1,
                    endSelected, wrapped, reverseWrapped, homeSelected, prevented,
                    saved: globalThis.settingsTestPayload.taxAmount === 125 && globalThis.settingsTestPayload.shippingFee === 250 && globalThis.settingsTestPayload.paymentMethods[0].title === "Bank Transfer" && globalThis.settingsTestPayload.advancedShipping.freeDeliveryEnabled && globalThis.settingsTestPayload.advancedShipping.freeDeliveryRadiusKm === 5 };
            } finally { await act(async () => { renderer?.unmount(); }); delete globalThis.settingsTestPayload; }
        }
        export function render(path, state = "loaded") {
            globalThis.settingsRenderState = state;
            const Page = path.endsWith("tax-shipping") ? TaxShippingPage : SettingsPage;
            return renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><Page /></MemoryRouter>);
        }
    ` }, bundle: true, platform: "node", format: "esm", jsx: "automatic", write: false,
    plugins: [{ name: "settings-render-boundaries", setup(plugin) {
        plugin.onResolve({ filter: /^(react|react-dom|react-test-renderer)(\/.*)?$/ }, args => ({ path: args.kind === "require-call" ? require.resolve(args.path) : pathToFileURL(require.resolve(args.path)).href, external: true }));
        plugin.onResolve({ filter: /hooks\/settings\.api$/ }, () => ({ path: "settings", namespace: "settings-test" }));
        plugin.onResolve({ filter: /hooks\/homePage\.api$/ }, () => ({ path: "upload", namespace: "settings-test" }));
        plugin.onResolve({ filter: /LocationPicker\.jsx$/ }, () => ({ path: "map", namespace: "settings-test" }));
        plugin.onLoad({ filter: /.*/, namespace: "settings-test" }, args => ({ contents: args.path === "settings" ? `
            const data = { settings: { taxAmount: 0, shippingFee: 0, smsProvider: "sms_gate", smsProviders: [{ id: "sms_gate", label: "SMS Gateway", fields: [] }], smsConfigurations: {} } };
            export const useGetSettings = () => ({ loading: globalThis.settingsRenderState === "loading", error: globalThis.settingsRenderState === "error" ? new Error("Unavailable") : null,
                data });
            export const useUpdateSettings = () => ({ updateSettings(payload) { globalThis.settingsTestPayload = payload; }, loading: false });
            export const useSmsTools = () => ({ attempts: [], sendTest() {}, testing: false });
        ` : args.path === "upload" ? "export const useUploadHomePageImage = () => ({ uploadImage() {}, loading: false });" : 'import { createElement } from "react"; export default function Map(props) { return createElement("div", { "data-map-radius": props.radiusKm }); }' }));
    } }],
    banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
});
const dir = await mkdtemp(join(tmpdir(), "ssi-settings-render-"));
let render, interactions;
try {
    const file = join(dir, "settings.mjs");
    await writeFile(file, bundle.outputFiles[0].text);
    ({ render } = await import(pathToFileURL(file).href));
    // Separate component contexts for the server and test renderers.
    const interactiveFile = join(dir, "interactive.mjs");
    await writeFile(interactiveFile, bundle.outputFiles[0].text);
    ({ interactions } = await import(pathToFileURL(interactiveFile).href));
} finally { await rm(dir, { recursive: true, force: true }); }

for (const path of ["/admin-dashboard/settings", "/admin-dashboard/settings/tax-shipping"]) {
    it(`renders ${path} with pricing, shipping and SMS controls after loading`, () => {
        const html = render(path);
        assert.match(html, /Manage tax, shipping, payment methods and SMS services/);
        assert.match(html, /SMS Service/);
        assert.match(html, /Save all settings/);
        assert.match(html, /Send test SMS/);
        assert.equal((html.match(/role="tab"/g) || []).length, 4);
        assert.equal((html.match(/role="tabpanel"/g) || []).length, 4);
        assert.equal((html.match(/hidden=""/g) || []).length, 3);
    });
    it(`renders loading and API failure states for ${path}`, () => {
        assert.match(render(path, "loading"), /aria-busy="true"/);
        assert.match(render(path, "error"), /role="alert"/);
    });
}

it("opens the requested settings tab from a shared URL", () => {
    const html = render("/admin-dashboard/settings?tab=sms");
    assert.match(html, /role="tab"[^>]*aria-selected="true"[^>]*>[\s\S]*?<span>SMS<\/span>/);
    assert.match(html, /role="tabpanel"[^>]*-panel-sms"[^>]*tabindex="0"/);
});

it("retains settings edits across tabs, saves all sections and supports keyboard navigation", async () => {
    assert.deepEqual(await interactions(), { preserved: true, defaultRadius: true, radiusPreview: true, singlePanel: true, endSelected: true, wrapped: true, reverseWrapped: true, homeSelected: true, prevented: true, saved: true });
});
