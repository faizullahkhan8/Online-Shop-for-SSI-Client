import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

const Select = ({
    options = [],
    value,
    onChange,
    placeholder = "All items",
    disabled = false,
    className,
}) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div ref={containerRef} className={clsx("relative w-full", className)}>
            {/* Trigger */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
                className={clsx(
                    "flex items-center justify-between w-full",
                    "px-4 py-2.5",
                    "bg-white border-2 border-gray-200 rounded-xl",
                    "text-sm outline-none",
                    "hover:border-primary-light transition-all duration-300",
                    "disabled:bg-gray-50 disabled:cursor-not-allowed"
                )}
            >
                <span className="truncate mr-2 text-gray-800">
                    {selectedOption?.label || placeholder}
                </span>

                <ChevronDown
                    size={16}
                    className={clsx(
                        "text-gray-500 transition-transform duration-150 shrink-0",
                        open && "rotate-180"
                    )}
                />
            </button>

            {/* Dropdown */}
            {open && !disabled && (
                <div
                    className={clsx(
                        "absolute z-50 mt-1 inset-x-0",
                        "max-h-64",
                        "bg-white border-2 border-gray-100 rounded-xl",
                        "shadow-xl shadow-primary-pale/30 py-2 overflow-y-auto"
                    )}
                >
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setOpen(false);
                            }}
                            className={clsx(
                                "px-4 py-2 text-sm cursor-pointer transition-colors",
                                "hover:bg-primary-pale hover:text-primary-dark",
                                value === option.value
                                    ? "bg-primary-pale text-primary-dark font-medium"
                                    : "text-gray-700"
                            )}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Select;
