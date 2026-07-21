/**
 * ProtectedRoute
 *
 * Wraps any route that requires authentication.
 * If the user is not authenticated, redirects to /login.
 * Also initializes the Socket.io connection once authenticated.
 */

import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import { useSocket } from "@/features/socket/hooks/Usesocket.js";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Initialize socket connection for authenticated users
  useSocket();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;