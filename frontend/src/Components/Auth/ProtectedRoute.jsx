import RouteLoading from "../UI/PageLoading";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children, roles = [] }) => {
    const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
    const location = useLocation();

    if (loading) return <RouteLoading />;

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
