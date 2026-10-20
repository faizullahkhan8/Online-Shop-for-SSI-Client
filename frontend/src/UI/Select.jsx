import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { useField } from "./fieldContext";

const Select = ({ options = [], value, onChange, placeholder = "Select an option", disabled = false, className, id, ...props }) => {
    const field = useField();
    const selected = options.some(option => String(option.value) === String(value));
    return <div className={clsx("relative w-full", className)}>
        <select {...props} id={id || field?.id} disabled={disabled} value={selected ? String(value) : ""}
            aria-describedby={props["aria-describedby"] || field?.descriptionId}
            aria-invalid={props["aria-invalid"] || (field?.error ? true : undefined)}
            aria-label={props["aria-label"] || (!field && !id ? placeholder : undefined)}
            onChange={event => { const option = options.find(item => String(item.value) === event.target.value); onChange?.(option ? option.value : ""); }}
            className="w-full h-11 appearance-none rounded-xl border border-gray-300 bg-white pl-3 pr-10 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary-pale disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed">
            {!selected && <option value="" disabled>{placeholder}</option>}
            {options.map(option => <option key={String(option.value)} value={String(option.value)} disabled={option.disabled}>{option.label}</option>)}
        </select>
        <ChevronDown size={17} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
    </div>;
};
export default Select;
