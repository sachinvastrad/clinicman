"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const INPUT_CLASS =
  "w-full h-10 px-3 text-sm rounded-md bg-card text-foreground border border-border " +
  "placeholder:text-muted-foreground-2 outline-none transition-[border-color,box-shadow] duration-fast " +
  "hover:border-border-strong focus-visible:border-primary focus-visible:shadow-focus";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showDemo = process.env.NODE_ENV !== "production";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-foreground text-background p-12">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(900px 500px at 8% 0%, hsl(158 64% 42% / 0.35), transparent 60%)," +
              "radial-gradient(700px 500px at 100% 100%, hsl(158 64% 22% / 0.55), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-9 w-9 rounded-md bg-white/10 p-1.5 object-contain" />
          <div>
            <p className="text-sm font-semibold tracking-tight">Sachi Homeopathic</p>
            <p className="text-xs text-background/60">Infer · Remediate · Cure</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <p className="text-2xl font-semibold tracking-tight leading-snug">
            Run your clinic with the calm precision of a tool built for healers.
          </p>
          <p className="mt-3 text-sm text-background/70">
            Patients, prescriptions, billing and follow-ups — unified in one quiet place.
          </p>
        </div>
        <p className="relative text-xs text-background/40">
          © {new Date().getFullYear()} Sachi Homeopathic Clinic
        </p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Brand for small screens */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <img src="/logo.png" alt="" className="h-9 w-auto object-contain" />
            <p className="text-sm font-semibold tracking-tight">Sachi Homeopathic</p>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in to continue to your clinic.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-xs font-medium text-foreground mb-1.5">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.com"
                className={INPUT_CLASS}
                autoFocus
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-foreground mb-1.5">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={INPUT_CLASS}
                autoComplete="current-password"
              />
            </label>

            {error && (
              <div
                role="alert"
                className="text-sm text-danger bg-danger-soft border border-danger/15 px-3 py-2 rounded-md"
              >
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          {showDemo && (
            <div className="mt-8 pt-5 border-t border-border">
              <p className="text-xs text-muted-foreground text-center font-medium mb-3">
                Demo Accounts (development only)
              </p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between px-2">
                  <span className="font-medium text-foreground">Admin</span>
                  <span>admin@sachihomeo.in · Admin@123</span>
                </div>
                <div className="flex justify-between px-2">
                  <span className="font-medium text-foreground">Doctor</span>
                  <span>doctor@sachihomeo.in · Doctor@123</span>
                </div>
                <div className="flex justify-between px-2">
                  <span className="font-medium text-foreground">Receptionist</span>
                  <span>reception@sachihomeo.in · Recep@123</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
