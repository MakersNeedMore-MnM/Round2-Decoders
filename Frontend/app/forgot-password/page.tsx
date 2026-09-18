import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { GuestGuard } from "@/components/auth/guest-guard";

export default function ForgotPasswordPage() {
  return (
    <GuestGuard>
      <AuthShell title="Reset your password" subtitle="We'll email you a secure reset link">
        <ForgotPasswordForm />
      </AuthShell>
    </GuestGuard>
  );
}