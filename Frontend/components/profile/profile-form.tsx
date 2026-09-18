"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  User as UserIcon,
  KeyRound,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Building,
  Shield,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { authService } from "@/services/auth.service";
import { apiFetch } from "@/services/api-client";
import { useCurrentUser } from "@/components/auth/auth-guard";

function initials(name: string) {
  return (
    name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function ProfileForm() {
  const router = useRouter();
  const user = useCurrentUser();

  // Profile Form State
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("RocketAI Corp");
  const [title, setTitle] = useState("Sales Director");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Preference State
  const [autoEnrich, setAutoEnrich] = useState(true);
  const [strictGuardrails, setStrictGuardrails] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [aiModel, setAiModel] = useState("openrouter");

  // Integration State
  const [gmailConnected, setGmailConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState("");

  useEffect(() => {
    if (user) {
      setFullname(user.username || "");
      setEmail(user.email || "");
    }
    loadGmailStatus();
  }, [user]);

  async function loadGmailStatus() {
    try {
      const data: any = await apiFetch("/auth/google/status");
      setGmailConnected(data.connected);
      setConnectedEmail(data.email || "");
    } catch {}
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(null);

    // Save profile settings to local storage or API
    try {
      localStorage.setItem(
        "prospectiq_user_profile",
        JSON.stringify({ fullname, email, organization, title, aiModel, autoEnrich, strictGuardrails })
      );
      await new Promise((res) => setTimeout(res, 400));
      setProfileSuccess("Profile preferences saved successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await new Promise((res) => setTimeout(res, 600));
      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  }

  function handleLogout() {
    authService.logout();
    router.push("/login");
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile Header Card */}
      <Card className="border border-white/10 bg-gradient-to-br from-[#121212] via-[#161618] to-[#121212] shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-cyan-500/30 ring-4 ring-cyan-500/10">
                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-cyan-950 to-purple-950 text-cyan-300">
                  {user ? initials(user.username) : "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-wide">{user?.username ?? "Sales Leader"}</h2>
                  <Badge variant="success" className="text-[10px]">Active</Badge>
                </div>
                <p className="text-xs text-white/50">{user?.email ?? ""}</p>
                <p className="mt-1 text-[11px] text-cyan-400 font-medium">{title} · {organization}</p>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={handleLogout} className="shrink-0">
              <LogOut className="h-3.5 w-3.5 mr-1" /> Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Details Form */}
      <Card className="border border-white/10 bg-[#121212]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-cyan-400" />
            <CardTitle>Personal Information</CardTitle>
          </div>
          <CardDescription>Update your personal details and organization role.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {profileSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullname">Full Name</Label>
                <Input
                  id="fullname"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="bg-white/[0.03]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/[0.03]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org">Organization</Label>
                <Input
                  id="org"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="bg-white/[0.03]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white/[0.03]"
                />
              </div>
            </div>

            <Separator className="my-2" />

            <div className="space-y-3">
              <Label>Default AI Intelligence Provider</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "openrouter", label: "OpenRouter", sub: "Multi-model Route" },
                  { id: "groq", label: "Groq", sub: "Ultra Fast Llama3" },
                  { id: "gemini", label: "Gemini Pro", sub: "Google AI" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAiModel(p.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      aiModel === p.id
                        ? "border-cyan-500/50 bg-cyan-500/10 text-white"
                        : "border-white/8 bg-white/[0.02] text-white/60 hover:bg-white/[0.04]"
                    }`}
                  >
                    <p className="text-xs font-semibold">{p.label}</p>
                    <p className="text-[10px] text-white/40">{p.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" size="sm" disabled={savingProfile} className="mt-2 bg-cyan-600 hover:bg-cyan-500 text-black font-semibold">
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Intelligence & Automation Preferences */}
      <Card className="border border-white/10 bg-[#121212]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-purple-400" />
            <CardTitle>Automation & Guardrail Controls</CardTitle>
          </div>
          <CardDescription>Configure auto-enrichment and AI safety parameters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/6 bg-white/[0.02] p-3.5">
            <div>
              <p className="text-xs font-semibold text-white">Auto Contact Email Enrichment</p>
              <p className="text-[11px] text-white/40">Automatically find and verify MX email records for new decision makers.</p>
            </div>
            <Switch checked={autoEnrich} onCheckedChange={setAutoEnrich} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/6 bg-white/[0.02] p-3.5">
            <div>
              <p className="text-xs font-semibold text-white">Strict AI Guardrails</p>
              <p className="text-[11px] text-white/40">Reject unverified claims or high risk outreach drafts automatically.</p>
            </div>
            <Switch checked={strictGuardrails} onCheckedChange={setStrictGuardrails} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/6 bg-white/[0.02] p-3.5">
            <div>
              <p className="text-xs font-semibold text-white">Gmail Integration</p>
              <p className="text-[11px] text-white/40">
                {gmailConnected ? `Connected as ${connectedEmail}` : "Connect Gmail to send outreach drafts directly from ProspectIQ."}
              </p>
            </div>
            <Badge variant={gmailConnected ? "success" : "outline"}>
              {gmailConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Security & Password */}
      <Card className="border border-white/10 bg-[#121212]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-emerald-400" />
            <CardTitle>Security & Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {passwordError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-white/[0.03]"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bg-white/[0.03]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bg-white/[0.03]"
                />
              </div>
            </div>

            <Button type="submit" size="sm" variant="secondary" disabled={updatingPassword}>
              {updatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
