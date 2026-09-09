"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminRoute({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const isAdmin = user?.role === "barakahAdmin1234";
  const isModerator = user?.role === "barakahModerator0102";

  useEffect(() => {
    // If still verifying authentication from localStorage / cookie, do nothing
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isAdmin && !isModerator) {
      router.replace("/");
    }
  }, [user, loading, isAdmin, isModerator, router]);

  if (loading || !user || (!isAdmin && !isModerator)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f0]">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-[#d4af37]"></span>
          <p className="text-xs text-[#3d2f1f]/60 font-medium tracking-wide">যাচাই করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return children;
}