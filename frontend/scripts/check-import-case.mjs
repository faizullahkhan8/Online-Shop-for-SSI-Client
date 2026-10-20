import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname, extname, parse, join } from "node:path";
const source = resolve("src");
let checked = 0;
function exact(path) {
    const root = parse(path).root;
    let current = root;
    for (const part of path.slice(root.length).split(/[\\/]/)) {
        if (!readdirSync(current).includes(part)) return false;
        current = join(current, part);
    }
    return true;
}
function scan(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) { scan(path); continue; }
        if (!/\.(js|jsx|mjs|ts|tsx)$/.test(path)) continue;
        const code = readFileSync(path, "utf8");
        for (const match of code.matchAll(/(?:from\s*|import\s*\(?\s*)["'](\.[^"']+)["']/g)) {
            const target = resolve(dirname(path), match[1]);
            const candidates = [".js", ".jsx", ".mjs", ".ts", ".tsx", ".css", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".json"].includes(extname(target)) ? [target] : [target, ...[".js", ".jsx", ".ts", ".tsx", "/index.js", "/index.jsx"].map(suffix => target + suffix)];
            const found = candidates.find(candidate => existsSync(candidate) && exact(candidate));
            if (!found) throw new Error(`Unresolved or incorrectly cased import ${match[1]} in ${path}`);
            checked++;
        }
    }
}
scan(source);
console.log(`Verified exact filename casing for ${checked} relative imports.`);
