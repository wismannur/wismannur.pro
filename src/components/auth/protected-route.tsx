import { useAuth } from "@/contexts/auth-context";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
	children: React.ReactNode;
	requireAuth?: boolean;
}

export const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
	const { user, loading: isLoading } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return null; // Or return a loading spinner
	}

	if (requireAuth && !user) {
		// Redirect to login page but save the attempted location
		return <Navigate to="/auth" state={{ from: location }} replace />;
	}

	if (!requireAuth && user) {
		// If user is already logged in and tries to access auth page, redirect to dashboard
		return <Navigate to="/cms/dashboard" replace />;
	}

	return <>{children}</>;
};
