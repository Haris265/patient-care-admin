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
      style={{ background: "linear-gradient(135deg, #0a1220 0%, #152744 100%)" }}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
    </div>
  );
}
