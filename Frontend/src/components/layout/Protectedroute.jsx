/**
 * ProtectedRoute
 *
 * Wraps any route that requires authentication.
 * - While the initial auth check is in-flight (isChecking), renders a
 *   full-screen spinner so we never redirect mid-check.
 * - If the user is not authenticated after the check, redirects to /login.
 * - Also initializes the Socket.io connection once authenticated.
 */

import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import { useSocket } from "@/features/socket/hooks/Usesocket.js";

const Spinner = () => (
  <div
    style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        width: 28,
        height: 28,
        border: "2px solid var(--border)",
        borderTopColor: "var(--accent)",
        borderRadius: "50%",
        animation: "spin 600ms linear infinite",
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isChecking } = useAuthStore();

  // Initialize socket connection for authenticated users
  useSocket();

  // Still verifying the token — don't redirect yet
  if (isChecking) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;