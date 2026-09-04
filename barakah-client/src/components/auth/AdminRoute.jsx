"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminRoute({ children }) {
  const router = useRouter();
  const { user } = useAuth();

  const isAdmin = user?.role === "barakahAdmin1234";
  const isModerator = user?.role === "barakahModerator0102";

  useEffect(() => {
    if (user === undefined) return; // still loading

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isAdmin && !isModerator) {
      router.replace("/");
    }
  }, [user, isAdmin, isModerator, router]);

  if (!user || (!isAdmin && !isModerator)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return children;
}