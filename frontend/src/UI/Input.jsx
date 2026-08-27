import React from "react";
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
    return (
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={clsx(
                "w-87.5 h-10 px-3 rounded-md border border-gray-300",
                "text-sm outline-none transition-all duration-100",
                "focus:border-primary focus:ring-2 focus:ring-primary-light",
                "disabled:bg-primary-pale disabled:cursor-not-allowed",
                className,
            )}
            {...props}
        />
    );
};

export default Input;
