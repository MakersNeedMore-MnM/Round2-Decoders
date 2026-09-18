"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, type CurrentUser } from "@/services/auth.service";
import { getToken, clearToken } from "@/services/api-client";

interface AuthContextValue {
  user: CurrentUser | null;
}

const AuthContext = createContext<AuthContextValue>({ user: null });

/** Access the currently logged-in user anywhere inside <AuthGuard>. */
export function useCurrentUser() {
  return useContext(AuthContext).user;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!getToken()) {
        router.replace("/login");
        return;
      }

      try {
        const me = await authService.me();
        if (!cancelled) {
          setUser(me);
          setChecked(true);
        }
      } catch {
        // Token missing/expired/invalid — clear it and send back to login.
        clearToken();
        if (!cancelled) router.replace("/login");
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-sm text-white/40">
        Checking your session…
      </div>
    );
  }

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}
