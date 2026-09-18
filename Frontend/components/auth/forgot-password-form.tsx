"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        <p className="text-sm text-white/70">Check your inbox</p>
        <p className="text-xs text-white/40">
          If an account exists for <span className="text-white/60">{email}</span>, a reset link is on
          its way.
        </p>
        <Link href="/login" className="mt-2 text-xs text-white/50 hover:text-white transition-colors">
          Back to sign in
        </Link>
      </div>
    );
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
      <Button type="submit" className="w-full">
        Send reset link
      </Button>
      <p className="pt-2 text-center text-[11px] text-white/30">
        <Link href="/login" className="text-white/60 hover:text-white transition-colors">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
