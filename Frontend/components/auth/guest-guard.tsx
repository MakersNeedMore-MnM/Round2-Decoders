"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { getToken, clearToken } from "@/services/api-client";

/**
 * Wrap /login, /signup, /forgot-password with this.
 * If the visitor already has a valid session, skip the form entirely
 * and send them straight to /workspace. If there's no token, or the
 * token is stale/invalid, just render the form as normal.
 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const token = getToken();

      if (!token) {
        setReady(true);
        return;
      }

      try {
        await authService.me();
        if (!cancelled) router.replace("/workspace");
      } catch {
        // Stale/invalid token — clear it and let the form show normally.
        clearToken();
        if (!cancelled) setReady(true);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090909] text-sm text-white/40">
        Checking your session…
      </div>
    );
  }

  return <>{children}</>;
}