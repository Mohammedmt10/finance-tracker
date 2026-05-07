/**
 * Signup Page — 3-Step OTP-Verified Registration
 *
 * Step 1: Enter email  → POST /auth/send-otp (purpose: SIGNUP)
 * Step 2: Enter OTP    → POST /auth/verify-otp → actionToken
 * Step 3: Set password → POST /auth/signup (email, password, actionToken)
 */

"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import OtpInput from "@/components/ui/OtpInput";

type Step = "email" | "otp" | "password";

export default function SignupPage() {
  const router = useRouter();

  /* ── Shared state ── */
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);

  /* ── Per-step data ── */
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [actionToken, setActionToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* ────────────────────────────────────────
     Step 1 — Send OTP
     ──────────────────────────────────────── */
  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/auth/send-otp", { email, purpose: "SIGNUP" });
      toast.success("OTP sent to your email!");
      setStep("otp");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to send OTP.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  /* ────────────────────────────────────────
     Step 2 — Verify OTP
     ──────────────────────────────────────── */
  async function handleVerifyOtp() {
    if (otp.length !== 4) return;
    setLoading(true);

    try {
      const res = await api.post("/auth/verify-otp", {
        email,
        otp,
        purpose: "SIGNUP",
      });
      setActionToken(res.data.actionToken);
      toast.success("Email verified!");
      setStep("password");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Invalid OTP.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  /* ────────────────────────────────────────
     Step 3 — Create Account
     ──────────────────────────────────────── */
  async function handleSignup(e: FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/signup", { email, password, actionToken });
      toast.success("Account created! Please sign in.");
      router.push("/signin");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Signup failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  /* ── Step indicator labels ── */
  const steps: { key: Step; label: string }[] = [
    { key: "email", label: "Email" },
    { key: "otp", label: "Verify" },
    { key: "password", label: "Password" },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <main className="flex items-center justify-center min-h-screen px-4">
      {/* Decorative gradient blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-primary-800/20 blur-[100px]" />
      </div>

      <Card className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600/20 mb-4">
            <UserPlus className="text-primary-400" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Join FinanceFlow and start tracking
          </p>
        </div>

        {/* Step progress bar */}
        <div className="flex items-center justify-between mb-8 px-2">
          {steps.map((s, idx) => (
            <React.Fragment key={s.key}>
              {/* Dot + label */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                    idx <= currentIdx
                      ? "bg-primary-600 text-white"
                      : "bg-surface-700 text-slate-500"
                  }`}
                >
                  {idx + 1}
                </div>
                <span className="text-[11px] text-slate-500">{s.label}</span>
              </div>
              {/* Connector line (skip after last dot) */}
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded transition-colors duration-300 ${
                    idx < currentIdx ? "bg-primary-600" : "bg-surface-700"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ═══ Step 1: Email ═══ */}
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" isLoading={loading} className="w-full">
              Send OTP
            </Button>
          </form>
        )}

        {/* ═══ Step 2: OTP ═══ */}
        {step === "otp" && (
          <div className="flex flex-col items-center gap-5">
            <ShieldCheck className="text-primary-400" size={40} />
            <p className="text-sm text-slate-400 text-center">
              Enter the 4-digit code sent to{" "}
              <span className="text-white font-medium">{email}</span>
            </p>
            <OtpInput
              onComplete={(code) => {
                setOtp(code);
              }}
            />
            <Button
              onClick={handleVerifyOtp}
              isLoading={loading}
              disabled={otp.length !== 4}
              className="w-full"
            >
              Verify OTP
            </Button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Change email
            </button>
          </div>
        )}

        {/* ═══ Step 3: Password ═══ */}
        {step === "password" && (
          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={18} />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <p className="text-[11px] text-slate-500">
              Must include uppercase, lowercase, number &amp; special character.
            </p>
            <Button type="submit" isLoading={loading} className="w-full">
              Create Account
            </Button>
          </form>
        )}

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            Sign In
          </Link>
        </p>
      </Card>
    </main>
  );
}
