import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "@/components/layout/Protectedroute.jsx";

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import("@/pages/auth/Login.jsx"));
const RegisterPage = lazy(() => import("@/pages/auth/Register.jsx"));
const GoogleCallbackPage = lazy(() => import("@/pages/auth/Googlecallbackpage.jsx"));
const DashboardPage = lazy(() => import("@/pages/dashboard/Dashboard.jsx"));
const BoardPage = lazy(() => import("@/pages/Whiteboard.jsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
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

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/google/success" element={<GoogleCallbackPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/board/:boardId"
              element={
                <ProtectedRoute>
                  <BoardPage />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)",
            fontFamily: "var(--font-sans)",
          },
          success: {
            iconTheme: { primary: "var(--success)", secondary: "var(--bg-elevated)" },
          },
          error: {
            iconTheme: { primary: "var(--danger)", secondary: "var(--bg-elevated)" },
          },
        }}
      />
    </QueryClientProvider>
  );
};

export default App;