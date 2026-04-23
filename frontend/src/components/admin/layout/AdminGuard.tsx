import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore.ts";

/** Chỉ cho phép user có role ADMIN vào /admin/* */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!user?.roles?.includes("ADMIN")) return <Navigate to="/" replace />;

    return <>{children}</>;
}
