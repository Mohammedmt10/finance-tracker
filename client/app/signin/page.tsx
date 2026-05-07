/**
 * Signin Page
 *
 * Simple email + password login form.
 * On success, stores the JWT and redirects to /dashboard.
 */

"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { LogIn, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function SigninPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* ── Handle form submission ── */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/signin", { email, password });
      toast.success("Signed in successfully!");
      login(res.data.token);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Sign in failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen px-4">
      {/* Decorative gradient blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-primary-800/20 blur-[100px]" />
      </div>

      <Card className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600/20 mb-4">
            <LogIn className="text-primary-400" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Sign in to your FinanceFlow account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            icon={<Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock size={18} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" isLoading={loading} className="w-full mt-2">
            Sign In
          </Button>
        </form>

        {/* Footer links */}
        <div className="mt-6 text-center text-sm text-slate-400 space-y-2">
          <p>
            <Link
              href="/forgot-password"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              Forgot your password?
            </Link>
          </p>
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </Card>
    </main>
  );
}
