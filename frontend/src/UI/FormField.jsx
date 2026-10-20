import { createElement, useId } from "react";
import { FieldContext, useField } from "./fieldContext";

export function FormField({ id, children, error, hint, ...props }) {
    const generatedId = useId();
    const fieldId = id || generatedId;
    const descriptionId = error || hint ? `${fieldId}-description` : undefined;
    return <FieldContext.Provider value={{ id: fieldId, error, descriptionId }}>
        <div {...props}>{children}{descriptionId && <p id={descriptionId} role={error ? "alert" : undefined} className={`mt-1 text-sm ${error ? "text-red-700" : "text-gray-600"}`}>{error || hint}</p>}</div>
    </FieldContext.Provider>;
}
export function FieldLabel(props) {
    const field = useField();
    return <label {...props} htmlFor={props.htmlFor || field?.id} />;
}
export function FieldControl({ as: Element = "input", id, ...props }) {
    const field = useField();
    return createElement(Element, { ...props, id: id || field?.id, "aria-describedby": props["aria-describedby"] || field?.descriptionId, "aria-invalid": props["aria-invalid"] || (field?.error ? true : undefined) });
}
