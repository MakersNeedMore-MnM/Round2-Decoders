"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/services/api-client";
import { GoogleLogin } from "@react-oauth/google";


export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleBtnWrapperRef = useRef<HTMLDivElement>(null);
  const [googleBtnWidth, setGoogleBtnWidth] = useState(360);

  useEffect(() => {
    if (googleBtnWrapperRef.current) {
      setGoogleBtnWidth(googleBtnWrapperRef.current.offsetWidth);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.login({ email, password });
      router.push("/workspace");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? "Incorrect email or password."
            : err.message || "Login failed. Please try again.",
        );
      } else {
        setError(
          "Could not reach the server. Is the backend running at " +
            (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") +
            "?",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Checkbox
          id="remember"
          checked={remember}
          onCheckedChange={(v) => setRemember(Boolean(v))}
        />
        <Label htmlFor="remember" className="text-white/50 cursor-pointer">
          Remember me
        </Label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign In
      </Button>

      <div className="flex items-center gap-3 py-1">
        <Separator className="flex-1" />
        <span className="text-[11px] text-white/25">or</span>
        <Separator className="flex-1" />
      </div>

      <div
        ref={googleBtnWrapperRef}
        className="flex justify-center overflow-hidden rounded-full border border-white/15 bg-[#111111] transition-colors hover:border-white/30 [&>div]:!w-full"
      >
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            if (!credentialResponse.credential) return;

            try {
              await authService.googleLogin(credentialResponse.credential);

              router.push("/workspace");
            } catch {
              setError("Google authentication failed.");
            }
          }}
          onError={() => {
            setError("Google authentication failed.");
          }}
          theme="filled_black"
          shape="pill"
          size="large"
          text="continue_with"
          logo_alignment="center"
          width={googleBtnWidth}
        />
      </div>

      <p className="pt-2 text-center text-[11px] text-white/30">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-white/60 hover:text-white transition-colors"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}