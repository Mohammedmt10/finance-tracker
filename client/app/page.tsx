/**
 * Root Page — Entry redirect
 *
 * If the user has a token → redirect to /dashboard
 * Otherwise → redirect to /signin
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    router.replace(token ? "/dashboard" : "/signin");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size={48} />
    </div>
  );
}
