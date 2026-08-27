/**
 * Loading Spinner Component
 * Simple spinner to show when waiting for data
 * Used for full-page loading states
 */

const LoadingSpinner = ({ message = "Loading..." }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            {/* Spinning circle animation */}
            <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            
            {/* Loading message */}
            <p className="mt-4 text-gray-500 text-sm">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
