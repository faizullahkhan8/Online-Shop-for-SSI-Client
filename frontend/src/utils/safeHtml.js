import DOMPurify from "dompurify";
export const safeHtml = html => DOMPurify.sanitize(typeof html === "string" ? html : "", {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "form", "input", "button", "iframe", "object", "embed"],
    FORBID_ATTR: ["style"],
});
