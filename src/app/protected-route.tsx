import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./auth-context";
import { PageSpinner } from "@/shared/ui/spinner";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) return <PageSpinner />;
  if (user) return <Navigate to="/painel" replace />;

  return <Outlet />;
}
