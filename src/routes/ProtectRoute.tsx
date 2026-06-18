import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";

const ADMIN_ONLY = [
  "/dashboard",
  "/inventory",
  "/sales",
  "/analytics",
  "/settings",
]

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const session = getSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (session.role === "cashier" && ADMIN_ONLY.includes(location.pathname)) {
    return <Navigate to="/cashier" replace />;
  }

  return <>{children}</>;
}
