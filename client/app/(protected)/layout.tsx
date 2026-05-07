/**
 * Protected Layout
 *
 * Route guard: redirects unauthenticated users to /signin.
 * Renders a responsive sidebar navigation for authenticated users.
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, User, LogOut, Menu, X, Wallet } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import Spinner from "@/components/ui/Spinner";

/* ── Navigation items ── */
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/signin");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show spinner while auth state is loading
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={48} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* ═══════════════════════════════════
          SIDEBAR
         ═══════════════════════════════════ */}

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64
          bg-surface-900 border-r border-surface-700
          flex flex-col
          transition-transform duration-300
          lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-700">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
            <Wallet className="text-white" size={20} />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            FinanceFlow
          </span>

          {/* Close button (mobile) */}
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-primary-600/15 text-primary-400"
                      : "text-slate-400 hover:bg-surface-800 hover:text-slate-200"
                  }
                `}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-surface-700">
          <button
            onClick={logout}
            className="
              flex items-center gap-3 w-full px-4 py-2.5 rounded-xl
              text-sm font-medium text-red-400
              hover:bg-red-500/10 transition-colors duration-200
            "
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════
          MAIN CONTENT
         ═══════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar (mobile hamburger) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-surface-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
          <span className="text-lg font-bold text-white">FinanceFlow</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
