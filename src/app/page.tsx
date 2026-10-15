"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getStoredUser, homePathForRole } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(homePathForRole(user.role));
  }, [router]);

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "var(--loading-bg)" }}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-400 border-t-transparent" />
    </div>
  );
}
