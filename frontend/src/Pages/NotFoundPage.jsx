import { Link } from "react-router-dom";
import { Home, Search, ArrowLeft } from "lucide-react";

const NotFoundPage = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="w-24 h-24 rounded-full bg-primary-pale flex items-center justify-center mb-6">
                <span className="text-5xl font-black text-primary">404</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Page Not Found
            </h1>
            <p className="text-sm text-gray-500 max-w-md mb-8 leading-relaxed">
                The page you're looking for doesn't exist or has been moved.
                Let's get you back on track.
            </p>
            <div className="flex items-center gap-3">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm"
                >
                    <Home size={16} />
                    Back to Home
                </Link>
                <Link
                    to="/products"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                    <Search size={16} />
                    Browse Products
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;
