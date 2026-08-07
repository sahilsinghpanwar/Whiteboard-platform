import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function GoogleSuccess() {
  const navigate = useNavigate();
  const { refreshMe } = useAuth();

  useEffect(() => {
    let ignore = false;
    refreshMe()
      .then((u) => {
        if (ignore) return;
        if (u) {
          toast.success("Signed in with Google!");
          navigate("/dashboard", { replace: true });
        } else {
          toast.error("Could not complete sign-in");
          navigate("/login", { replace: true });
        }
      })
      .catch(() => {
        if (ignore) return;
        toast.error("Could not complete sign-in");
        navigate("/login", { replace: true });
      });
    return () => {
      ignore = true;
    };
  }, [navigate, refreshMe]);

  return <div className="min-h-screen flex items-center justify-center label-mono">Completing sign-in…</div>;
}
