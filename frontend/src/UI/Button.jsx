import clsx from "clsx";

const VARIANTS = {
    primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary-dark",
    secondary:
        "bg-primary-pale text-primary-dark hover:bg-primary-light focus:ring-primary",
    success: "bg-primary text-white hover:bg-primary-dark focus:ring-primary",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
    outline:
        "bg-white border border-primary-light text-primary-dark hover:bg-primary-pale focus:ring-primary-light",
    ghost: "bg-transparent text-primary-dark hover:bg-primary-pale focus:ring-primary-light",
};

const SIZES = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
};

const Button = ({
    children,
    variant = "primary",
    size = "md",
    type = "button",
    disabled = false,
    loading = false,
    className,
    onClick,
}) => {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={clsx(
                "inline-flex items-center justify-center gap-2 cursor-pointer",
                "rounded-md font-medium transition-all",
                "focus:outline-none focus:ring-2 focus:ring-offset-1",
                VARIANTS[variant],
                SIZES[size],
                (disabled || loading) && "opacity-60 cursor-not-allowed",
                className
            )}
        >
            {loading && (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {children}
        </button>
    );
};

export default Button;
