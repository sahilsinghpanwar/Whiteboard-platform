import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GoogleLogo, PenNib } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/services";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) return toast.error("Please fill all fields");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    try {
      await register(fullName, email, password);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-neutral-950 text-white relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2 z-10">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <PenNib size={18} weight="fill" color="#fff" />
          </div>
          <span className="font-bold tracking-tight text-lg">Kanvas</span>
        </Link>
        <div className="z-10 relative">
          <h2 className="text-3xl font-semibold tracking-tight leading-tight max-w-md">
            Draw. Diagram. Ship faster with your team.
          </h2>
          <p className="text-sm text-neutral-400 mt-4 font-mono">— get started in seconds</p>
        </div>
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_80%_80%,rgba(255,107,53,0.4),transparent_40%)]" />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Create account</h1>
            <p className="text-sm text-muted-foreground mt-1.5">No credit card. Free forever tier.</p>
          </div>

          <a href={authApi.googleUrl()} data-testid="google-signup-btn">
            <Button type="button" variant="outline" className="w-full h-11 rounded-lg gap-2">
              <GoogleLogo size={18} weight="bold" /> Continue with Google
            </Button>
          </a>

          <div className="flex items-center gap-3 my-6">
            <span className="h-px flex-1 bg-border" />
            <span className="label-mono">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                data-testid="register-name-input" placeholder="Ada Lovelace" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                data-testid="register-email-input" placeholder="you@company.com" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                data-testid="register-password-input" placeholder="at least 8 characters" className="h-11" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 rounded-lg" data-testid="register-submit-btn">
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
