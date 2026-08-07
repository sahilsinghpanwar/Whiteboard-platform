import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function GoogleSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setTokenAndRefresh } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    if (!token) { toast.error("Google sign-in failed"); navigate("/login", { replace: true }); return; }
    setTokenAndRefresh(token)
      .then((u) => {
        if (u) { toast.success("Signed in with Google!"); navigate("/dashboard", { replace: true }); }
        else { toast.error("Could not complete sign-in"); navigate("/login", { replace: true }); }
      })
      .catch(() => {
        toast.error("Could not complete sign-in");
        navigate("/login", { replace: true });
      });
},[params, navigate, setTokenAndRefresh]);

  return <div className="min-h-screen flex items-center justify-center label-mono">Completing sign-in…</div>;
}
