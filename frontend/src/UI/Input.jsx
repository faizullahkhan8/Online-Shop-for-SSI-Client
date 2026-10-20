import { useField } from "./fieldContext";
import clsx from "clsx";

const Input = ({
    type = "text",
    value,
    onChange,
    placeholder,
    name,
    disabled = false,
    className,
    ...props
}) => {
    const field = useField();
    return (
        <input
            id={props.id || field?.id}
            aria-describedby={props["aria-describedby"] || field?.descriptionId}
            aria-invalid={props["aria-invalid"] || (field?.error ? true : undefined)}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={clsx(
                "w-full h-11 px-4 rounded-xl border border-gray-300",
                "text-sm outline-none transition-all duration-300",
                "focus:border-primary focus:ring-4 focus:ring-primary-pale bg-white",
                "disabled:bg-gray-50 disabled:cursor-not-allowed",
                className,
            )}
            {...props}
        />
    );
};

export default Input;
