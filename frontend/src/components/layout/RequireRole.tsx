import { Navigate } from "react-router-dom";
import { useSession } from "@/lib/session";
import type { UserProfile } from "@/types";

// Frontend route guard — the real access control also lives in the backend (role-checked routers).
export default function RequireRole({
  roles,
  children,
}: {
  roles: string[];
  children: (user: UserProfile) => React.ReactNode;
}) {
  const { data: user, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background">
        <p className="font-mono text-sm text-primary animate-flicker" data-testid="session-loading">
          OTURUM DOĞRULANIYOR<span className="animate-blink">▊</span>
        </p>
      </div>
    );
  }
  if (!user) return <Navigate to="/giris" replace />;
  if (!roles.includes(user.role)) {
    return <Navigate to={user.role === "student" ? "/" : "/pano"} replace />;
  }
  return <>{children(user)}</>;
}
