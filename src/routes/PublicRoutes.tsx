import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";

export function PublicRoute({ children }: { children: ReactNode }) {
  const session = getSession();

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
