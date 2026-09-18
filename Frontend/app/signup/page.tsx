import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { GuestGuard } from "@/components/auth/guest-guard";

export default function SignupPage() {
  return (
    <GuestGuard>
      <AuthShell title="Create your account" subtitle="Set up your ProspectIQ workspace">
        <SignupForm />
      </AuthShell>
    </GuestGuard>
  );
}