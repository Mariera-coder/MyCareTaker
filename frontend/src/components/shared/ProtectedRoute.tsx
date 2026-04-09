import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import type { Role } from "@/lib/types";

interface ProtectedRouteProps {
  allow?: Role[];
}

export function ProtectedRoute({ allow }: ProtectedRouteProps) {
  const location = useLocation();
  const { sessionChecked, user } = useAppSelector((state) => state.auth);
  const isAuthenticated = Boolean(user);

  if (!sessionChecked) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/who-are-you" replace state={{ from: location }} />;
  }

  if (allow?.length && user && !allow.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
