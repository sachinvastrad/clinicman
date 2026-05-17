"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendOtpSchema, verifyOtpSchema } from "@/lib/validations/user";
import { cn } from "@/lib/utils";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep]       = useState<Step>("phone");
  const [phone, setPhone]     = useState("");
  const [otp, setOtp]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = sendOtpSchema.safeParse({ phone });
    if (!result.success) { setError(result.error.errors[0].message); return; }

    setLoading(true);
    const formatted = phone.startsWith("+") ? phone : `+91${phone}`;
    const { error: supaErr } = await supabase.auth.signInWithOtp({ phone: formatted });
    setLoading(false);

    if (supaErr) { setError(supaErr.message); return; }
    setPhone(formatted);
    setStep("otp");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = verifyOtpSchema.safeParse({ phone, otp });
    if (!result.success) { setError(result.error.errors[0].message); return; }

    setLoading(true);
    const { error: supaErr } = await supabase.auth.verifyOtp({
      phone, token: otp, type: "sms",
    });
    setLoading(false);

    if (supaErr) { setError(supaErr.message); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white text-2xl font-bold mb-4 shadow-lg">
            Dr
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DrMan.ai</h1>
          <p className="text-sm text-muted-foreground mt-1">Homeopathic Clinic OS</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === "phone" ? (
            <>
              <h2 className="text-xl font-semibold mb-1">Welcome back</h2>
              <p className="text-sm text-muted-foreground mb-6">Enter your phone number to receive an OTP</p>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                  <div className="flex rounded-lg border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                    <span className="flex items-center px-3 bg-muted text-sm text-muted-foreground border-r border-input">+91</span>
                    <input
                      type="tel"
                      value={phone.startsWith("+91") ? phone.slice(3) : phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                      className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
                      autoFocus
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {loading ? "Sending OTP…" : "Send OTP"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-1">Verify OTP</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Enter the 6-digit code sent to <span className="font-medium text-foreground">{phone}</span>
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">One-Time Password</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    className="w-full border border-input rounded-lg px-3 py-2.5 text-center text-xl tracking-widest outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {loading ? "Verifying…" : "Verify & Login"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Change number
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
