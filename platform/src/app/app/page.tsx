"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppRoot() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/dashboard/");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-sm font-medium">Loading dashboard…</span>
      </div>
    </div>
  );
}
