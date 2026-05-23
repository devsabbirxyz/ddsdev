import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGuard,
});

function AuthGuard() {
  const { isAuthenticated, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const redirect = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      nav({ to: "/login", search: { redirect } as never, replace: true });
    }
  }, [loading, isAuthenticated, nav]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <Outlet />;
}
