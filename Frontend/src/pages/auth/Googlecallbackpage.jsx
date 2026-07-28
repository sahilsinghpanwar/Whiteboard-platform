import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI as authApi } from "@/features/auth/api/Auth.api.js";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setTokenFromGoogle = useAuthStore((s) => s.setTokenFromGoogle);

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error || !token) {
      toast.error("Google sign-in failed. Please try again.");
      navigate("/login");
      return;
    }

    // Set token in localStorage and Zustand state BEFORE calling getMe()
    localStorage.setItem("accessToken", token);
    useAuthStore.setState({ token });

    authApi
      .getMe()
      .then((res) => {
        const user = res.data.data?.user || res.data.data;
        setTokenFromGoogle(token, user);
        window.history.replaceState({}, "", "/dashboard");
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        toast.error("Could not retrieve your profile. Please log in again.");
        navigate("/login");
      });
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
        fontSize: "var(--text-md)",
      }}
    >
      Signing you in…
    </div>
  );
};

export default GoogleCallbackPage;