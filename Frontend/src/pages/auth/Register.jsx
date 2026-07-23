import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import { API_BASE_URL } from "@/shared/constants/index.js";
import styles from "./Authpage.module.css";

const GOOGLE_AUTH_URL = `${API_BASE_URL}/auth/google`;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
    <path d="M3.964 10.707C3.784 10.167 3.682 9.59 3.682 9s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

const BrandLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="9" height="9" rx="2" fill="#7C6EF8" />
    <rect x="13" y="2" width="9" height="9" rx="2" fill="#7C6EF8" opacity="0.5" />
    <rect x="2" y="13" width="9" height="9" rx="2" fill="#7C6EF8" opacity="0.5" />
    <rect x="13" y="13" width="9" height="9" rx="2" fill="#7C6EF8" />
  </svg>
);

// ─── Reusable Field ───────────────────────────────────────────────────────────

const Field = ({ label, error, children }) => (
  <div className={styles.field}>
    <label className={styles.label}>{label}</label>
    {children}
    {error && (
      <p className={styles.fieldError} role="alert">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

// ─── Left Panel (shared branding) ────────────────────────────────────────────

const LeftPanel = () => (
  <div className={styles.leftPanel}>
    <div className={styles.leftPanelInner}>
      {/* Back to home */}
      <Link to="/" className={styles.backLink}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to home
      </Link>

      {/* Brand */}
      <div className={styles.leftBrand}>
        <div className={styles.leftBrandLogo}>
          <BrandLogo />
        </div>
        <span className={styles.leftBrandName}>Canvai</span>
      </div>

      {/* Headline */}
      <div className={styles.leftHeadline}>
        <h2 className={styles.leftTitle}>
          Think together,<br />
          <span className={styles.leftTitleAccent}>build faster.</span>
        </h2>
        <p className={styles.leftSub}>
          A modern AI-powered whiteboard where your team's best ideas come to life.
        </p>
      </div>

      {/* Feature pills */}
      <ul className={styles.leftFeatures}>
        {[
          { icon: "✦", text: "AI-generated diagrams & summaries" },
          { icon: "✦", text: "Real-time multi-user collaboration" },
          { icon: "✦", text: "Export to PNG, SVG or PDF" },
          { icon: "✦", text: "Enterprise-grade security" },
        ].map((f) => (
          <li key={f.text} className={styles.leftFeatureItem}>
            <span className={styles.leftFeatureBullet}>{f.icon}</span>
            {f.text}
          </li>
        ))}
      </ul>

      {/* Social proof */}
      <div className={styles.leftProof}>
        <div className={styles.proofAvatars}>
          {["#7C6EF8", "#10B981", "#F59E0B", "#3B82F6"].map((c, i) => (
            <div key={i} className={styles.proofAvatar} style={{ background: c }} />
          ))}
        </div>
        <p className={styles.proofText}>
          Trusted by <strong>10,000+</strong> teams worldwide
        </p>
      </div>
    </div>
  </div>
);

// ─── Register Page ────────────────────────────────────────────────────────────

const RegisterPage = () => {
  const navigate = useNavigate();
  const registerStore = useAuthStore((s) => s.register);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  // Password strength indicator
  const getStrength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const strength = getStrength(form.password);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#EF4444", "#F59E0B", "#10B981", "#7C6EF8"];

  return (
    <div className={styles.page}>
      <LeftPanel />

      {/* Right — Form */}
      <div className={styles.rightPanel}>
        <motion.div
          className={styles.formCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.formHead}>
            <h1 className={styles.formTitle}>Create your workspace</h1>
            <p className={styles.formSub}>Start collaborating in seconds. Free forever.</p>
          </div>

          {/* Google OAuth */}
          <a href={GOOGLE_AUTH_URL} className={styles.googleBtn}>
            <GoogleIcon />
            Continue with Google
          </a>

          <div className={styles.divider}>
            <span>or continue with email</span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <Field label="Full name" error={errors.fullName}>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <input
                  className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
                  type="text"
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  autoComplete="name"
                />
              </div>
            </Field>

            <Field label="Email address" error={errors.email}>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  autoComplete="email"
                />
              </div>
            </Field>

            <Field label="Password" error={errors.password}>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={handleChange("password")}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength meter */}
              {form.password && (
                <div className={styles.strengthWrap}>
                  <div className={styles.strengthBars}>
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={styles.strengthBar}
                        style={{
                          background: n <= strength ? strengthColors[strength] : "#E5E7EB",
                          transition: "background 0.2s ease",
                        }}
                      />
                    ))}
                  </div>
                  <span className={styles.strengthLabel} style={{ color: strengthColors[strength] }}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </Field>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner} />
                  Creating account…
                </>
              ) : (
                <>
                  Create free account
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>

            <p className={styles.termsText}>
              By creating an account, you agree to our{" "}
              <span className={styles.termsLink}>Terms of Service</span> and{" "}
              <span className={styles.termsLink}>Privacy Policy</span>.
            </p>
          </form>

          <p className={styles.switchText}>
            Already have an account?{" "}
            <Link to="/login" className={styles.switchLink}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;