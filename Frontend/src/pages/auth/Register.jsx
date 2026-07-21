import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { authAPI as authApi } from "@/features/auth/api/Auth.api.js";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import { API_BASE_URL } from "@/shared/constants/index.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import styles from "./Authpage.module.css";

const GOOGLE_AUTH_URL = `${API_BASE_URL}/auth/google`;

const RegisterPage = () => {
  const navigate = useNavigate();
  const registerStore = useAuthStore((s) => s.register);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    else if (form.fullName.trim().length < 2) errs.fullName = "At least 2 characters";
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "At least 8 characters";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setIsLoading(true);
    try {
      const res = await registerStore(form);
      if (res.success) {
        toast.success("Welcome to Canvai!");
        navigate("/dashboard");
      } else {
        toast.error(res.message || "Registration failed");
      }
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  return (
    <div className={`${styles.page} grid-texture`}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.brand}>
          <div className={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="9" height="9" rx="2" fill="var(--accent)"/>
              <rect x="13" y="2" width="9" height="9" rx="2" fill="var(--accent)" opacity="0.5"/>
              <rect x="2" y="13" width="9" height="9" rx="2" fill="var(--accent)" opacity="0.5"/>
              <rect x="13" y="13" width="9" height="9" rx="2" fill="var(--accent)"/>
            </svg>
          </div>
          <span className={styles.brandName}>Canvai</span>
        </div>

        <h1 className={styles.heading}>Create your workspace</h1>
        <p className={styles.subheading}>Start collaborating in seconds</p>

        <a href={GOOGLE_AUTH_URL} className={styles.googleBtn}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707C3.784 10.167 3.682 9.59 3.682 9s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>

        <div className={styles.divider}><span>or</span></div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className="space-y-1">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              type="text"
              placeholder="Your name"
              value={form.fullName}
              onChange={handleChange("fullName")}
              autoComplete="name"
            />
            {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange("email")}
              autoComplete="email"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange("password")}
              autoComplete="new-password"
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;