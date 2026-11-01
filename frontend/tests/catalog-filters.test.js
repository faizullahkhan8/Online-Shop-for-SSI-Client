import { it } from "node:test";
import assert from "node:assert/strict";
import { readCatalogFilters, writeCatalogFilters, clearCatalogFilters, catalogQuery, filterCount, priceError, categoryOptions, filterChips } from "../src/utils/catalogFilters.js";

it("round-trips multi-select filters without losing commas, URL characters or existing presentation state", () => {
    const original = new URLSearchParams("page=4&view=list&sort=price_desc&campaign=spring");
    const next = writeCatalogFilters(original, { category: ["child", "parent"], brand: ["Health, Plus", "A&B", "Health, Plus"], vendor: ["supplier"], minPrice: "0", maxPrice: "250", onSale: true });
    assert.equal(original.get("page"), "4"); assert.equal(next.has("page"), false);
    const filters = readCatalogFilters(new URLSearchParams(next.toString()));
    assert.deepEqual(filters.brand, ["A&B", "Health, Plus"]);
    assert.equal(filters.minPrice, "0"); assert.equal(filters.onSale, true);
    const query = catalogQuery(filters, next);
    assert.equal(query.sort, "price_desc"); assert.equal(query.page, 1); assert.deepEqual(query.brand, filters.brand);
    assert.equal(next.get("view"), "list"); assert.equal(next.get("campaign"), "spring");
});

it("clears applied filters and pagination while preserving sorting and shared-link state", () => {
    const previous = new URLSearchParams("search=care&category=a&brand=b&page=6&onSale=true&sort=rating&view=list");
    const cleared = clearCatalogFilters(previous);
    assert.equal(filterCount(readCatalogFilters(cleared)), 0);
    assert.equal(cleared.get("sort"), "rating"); assert.equal(cleared.get("view"), "list");
    assert.equal(previous.get("search"), "care");
    assert.equal(readCatalogFilters(new URLSearchParams(previous.toString())).search, "care");
});

it("supports zero-price ranges and reports invalid or inverted bounds", () => {
    assert.equal(priceError("0", "0"), ""); assert.equal(priceError("", ""), "");
    for (const [min, max] of [["200", "100"], ["-1", ""], ["NaN", ""], [" ", ""], ["Infinity", ""], ["", "1000000000001"]]) assert.ok(priceError(min, max));
    const f = readCatalogFilters(new URLSearchParams("minPrice=0&maxPrice=0&brand=A&brand=B&availability=in_stock&minRating=4"));
    assert.equal(filterCount(f), 5);
    assert.ok(filterChips(f, { brands: [{ value: "A", label: "Brand A" }] }).some(chip => chip.label === "Brand A"));
});

it("orders category descendants without looping on broken category relationships", () => {
    const options = categoryOptions([{ value: "child", label: "Child", parentId: "parent" }, { value: "parent", label: "Parent", parentId: null }, { value: "cycle", label: "Cycle", parentId: "cycle" }]);
    assert.deepEqual(options.map(o => o.value), ["parent", "child", "cycle"]);
    assert.equal(options[1].depth, 1);
    assert.equal(catalogQuery(readCatalogFilters(new URLSearchParams("search=care")), new URLSearchParams("page=bad")).page, 1);
});
