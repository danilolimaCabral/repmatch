import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Optionally restrict to a specific role */
  requiredRole?: "admin" | "user";
}

/**
 * Wraps any page that requires authentication.
 * - Shows a loading skeleton while the auth state is being resolved.
 * - Redirects to /login if the user is not authenticated.
 * - Redirects to / if the user doesn't have the required role.
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    // useAuth with redirectOnUnauthenticated:true handles the redirect,
    // but we return null to avoid rendering children while redirecting.
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    window.location.href = "/";
    return null;
  }

  return <>{children}</>;
}
