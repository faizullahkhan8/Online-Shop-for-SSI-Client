/**
 * Loading Spinner Component
 * Branded spinner with pulse animation
 * Used for full-page loading states
 */

const LoadingSpinner = ({ message = "Loading..." }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-primary-pale" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary-dark animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
            </div>
            <p className="text-gray-500 text-sm font-semibold">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
