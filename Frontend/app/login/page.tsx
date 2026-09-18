import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { GuestGuard } from "@/components/auth/guest-guard";

export default function LoginPage() {
  return (
    <GuestGuard>
      <AuthShell title="Welcome back" subtitle="Sign in to your ProspectIQ workspace">
        <LoginForm />
      </AuthShell>
    </GuestGuard>
  );
}