import sanitizeHtml from "sanitize-html";

export const safeHtml = value => sanitizeHtml(typeof value === "string" ? value : "", {
    allowedTags: ["p", "br", "div", "span", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "blockquote", "pre", "code", "ul", "ol", "li", "a", "img", "table", "thead", "tbody", "tr", "th", "td", "hr"],
    allowedAttributes: { "*": ["class"], a: ["href", "title", "target", "rel"], img: ["src", "alt", "width", "height"], td: ["colspan", "rowspan"], th: ["colspan", "rowspan"] },
    allowedSchemes: ["https", "http", "mailto", "tel"], allowProtocolRelative: false,
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
});

export function safeContentTree(value) {
    if (Array.isArray(value)) return value.map(safeContentTree);
    if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) return value;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
        ["html", "contentHTML", "description"].includes(key) && typeof item === "string" ? safeHtml(item) : safeContentTree(item)]));
}

// Covers legacy stored HTML on reads as well as new JSON writes.
export function safeContentMiddleware(req, res, next) {
    req.body = safeContentTree(req.body);
    const json = res.json.bind(res);
    res.json = value => json(safeContentTree(JSON.parse(JSON.stringify(value))));
    next();
}
