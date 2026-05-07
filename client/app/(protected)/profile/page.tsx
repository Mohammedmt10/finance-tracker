/**
 * Profile Page
 *
 * Displays user information (email, masked password) and provides:
 * - Change Password form (current + new password)
 * - Logout button
 *
 * Data source: GET /profile  |  PUT /profile/change-password
 */

"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { User, Mail, Lock, ShieldCheck, LogOut } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export default function ProfilePage() {
  const { logout } = useAuth();

  /* ── Profile data ── */
  const [email, setEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);

  /* ── Change password form ── */
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePwLoading, setChangePwLoading] = useState(false);

  /* ────────────────────────────────────
     FETCH PROFILE
     ──────────────────────────────────── */
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get("/profile");
        setEmail(res.data.email);
      } catch {
        toast.error("Failed to load profile.");
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, []);

  /* ────────────────────────────────────
     CHANGE PASSWORD
     ──────────────────────────────────── */
  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setChangePwLoading(true);

    try {
      await api.put("/profile/change-password", {
        currentPassword,
        newPassword,
      });

      toast.success("Password changed successfully!");

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Password change failed.";
      toast.error(msg);
    } finally {
      setChangePwLoading(false);
    }
  }

  /* ────────────────────────────────────
     RENDER
     ──────────────────────────────────── */
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Profile</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your account settings
        </p>
      </div>

      {/* ═══════════════════════════════════
          USER INFO CARD
         ═══════════════════════════════════ */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary-600/20 flex items-center justify-center">
            <User className="text-primary-400" size={32} />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{email}</p>
            <p className="text-sm text-slate-500">Verified account</p>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-800/50">
            <Mail size={18} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Email
              </p>
              <p className="text-sm text-slate-200">{email}</p>
            </div>
          </div>

          {/* Password (masked) */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-800/50">
            <Lock size={18} className="text-slate-400" />
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Password
              </p>
              <p className="text-sm text-slate-200">••••••••</p>
            </div>
            <button
              onClick={() => setShowChangePassword((prev) => !prev)}
              className="text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              {showChangePassword ? "Cancel" : "Change"}
            </button>
          </div>
        </div>
      </Card>

      {/* ═══════════════════════════════════
          CHANGE PASSWORD FORM
         ═══════════════════════════════════ */}
      {showChangePassword && (
        <Card className="animate-scale-in">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary-400" />
            Change Password
          </h2>

          <form
            onSubmit={handleChangePassword}
            className="flex flex-col gap-5"
          >
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={18} />}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={18} />}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm New Password"
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

            <Button
              type="submit"
              isLoading={changePwLoading}
              className="w-full"
            >
              Update Password
            </Button>
          </form>
        </Card>
      )}

      {/* ═══════════════════════════════════
          LOGOUT BUTTON
         ═══════════════════════════════════ */}
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Sign out</p>
          <p className="text-xs text-slate-500">
            End your session on this device
          </p>
        </div>
        <Button variant="danger" onClick={logout}>
          <LogOut size={16} />
          Logout
        </Button>
      </Card>
    </div>
  );
}
