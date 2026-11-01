import { it } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);

it("updates the delivery circle in meters, follows the store pin and fits it after a hidden tab becomes visible", async () => {
    const bundle = await build({ stdin: { resolveDir: resolve("."), loader: "jsx", contents: `
        import { create, act } from "react-test-renderer";
        import LocationPicker from "./src/Components/LocationPicker.jsx";
        export async function exercise() {
            globalThis.IS_REACT_ACT_ENVIRONMENT = true;
            const savedObserver = globalThis.ResizeObserver;
            const container = { isConnected: true, clientWidth: 0 };
            let resize;
            globalThis.ResizeObserver = class { constructor(callback) { resize = callback; } observe() {} disconnect() {} };
            const fits = [];
            globalThis.deliveryTestMap = { getContainer: () => container, fitBounds: bounds => fits.push(bounds), invalidateSize() {}, setView() {}, getZoom: () => 12 };
            let renderer;
            const view = (radius, lat = 0) => <LocationPicker position={{ lat, lng: 0 }} setPosition={() => {}} radiusKm={radius} />;
            try {
                await act(async () => { renderer = create(view(3)); });
                const circle = () => renderer.root.findAllByType("div").find(node => node.props["data-circle"]);
                const initial = circle().props.radius === 3000 && fits.length === 0;
                container.clientWidth = 375;
                await act(async () => { resize(); });
                const visibleFit = fits.at(-1).diameter === 6000;
                await act(async () => { renderer.update(view(5, 1)); });
                const updated = circle().props.radius === 5000 && circle().props.center[0] === 1 && fits.at(-1).diameter === 10000 && fits.at(-1).lat === 1;
                await act(async () => { renderer.update(view(0)); });
                const disabled = !circle();
                return { initial, visibleFit, updated, disabled };
            } finally { await act(async () => { renderer?.unmount(); }); globalThis.ResizeObserver = savedObserver; delete globalThis.deliveryTestMap; }
        }
    ` }, bundle: true, platform: "node", format: "esm", jsx: "automatic", write: false,
        plugins: [{ name: "map-test-boundaries", setup(plugin) {
            plugin.onResolve({ filter: /^(react|react-dom|react-test-renderer)(\/.*)?$/ }, args => ({ path: args.kind === "require-call" ? require.resolve(args.path) : pathToFileURL(require.resolve(args.path)).href, external: true }));
            plugin.onResolve({ filter: /^(leaflet|react-leaflet|leaflet\/dist\/leaflet.css)$/ }, args => ({ path: args.path, namespace: "map-test" }));
            plugin.onLoad({ filter: /.*/, namespace: "map-test" }, args => ({ loader: "jsx", contents: args.path === "react-leaflet" ? `
                export const useMap = () => globalThis.deliveryTestMap;
                export const useMapEvents = () => globalThis.deliveryTestMap;
                export const MapContainer = ({ children }) => <div>{children}</div>;
                export const TileLayer = () => null;
                export const Marker = () => null;
                export const Circle = props => <div {...props} data-circle="true" />;
            ` : args.path === "leaflet" ? `export default { Icon: class {}, latLng: (lat, lng) => ({ toBounds: diameter => ({ lat, lng, diameter }) }) };` : "" }));
        } }], banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
    });
    const dir = await mkdtemp(join(tmpdir(), "ssi-delivery-circle-"));
    try {
        const file = join(dir, "circle.mjs"); await writeFile(file, bundle.outputFiles[0].text);
        const { exercise } = await import(pathToFileURL(file).href);
        assert.deepEqual(await exercise(), { initial: true, visibleFit: true, updated: true, disabled: true });
    } finally { await rm(dir, { recursive: true, force: true }); }
});
