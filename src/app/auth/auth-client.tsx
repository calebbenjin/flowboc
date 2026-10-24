"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ComponentProps, type FormEvent } from "react";
import { getSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { Check, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { markDeviceAuthed } from "@/lib/auth-device";
import { usePendingAction } from "@/hooks/use-pending-action";
import { forgotPassword, resendOtp, resetPassword, signUp, verifyOtp } from "./actions";

type Mode = "signup" | "login" | "verify" | "forgot" | "forgot-sent" | "reset";

const NETWORK_ERROR_MESSAGE = "Network error — please check your connection and try again.";

function PasswordInput(props: ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-10" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function AuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");
  const resetToken = searchParams.get("token");
  const modeParam = searchParams.get("mode");
  // Pricing-page CTAs link here as ?plan=starter|pro|premium so the tier
  // picked on the marketing site carries through to the Instructor row
  // onboarding creates (see pendingPlanTier on User).
  const planParam = searchParams.get("plan")?.toUpperCase();
  const validPlan =
    planParam === "STARTER" || planParam === "PRO" || planParam === "PREMIUM"
      ? planParam
      : undefined;

  const [mode, setMode] = useState<Mode>(
    resetToken ? "reset" : modeParam === "login" ? "login" : "signup",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [referralCode, setReferralCode] = useState(refParam ?? "");
  const [googlePending, setGooglePending] = useState(false);
  const action = usePendingAction();
  const resendAction = usePendingAction();

  function slowLabel(idleLabel: string, pendingLabel: string, forAction = action) {
    if (forAction.isSlow) return "Still working — check your connection…";
    return forAction.isPending ? pendingLabel : idleLabel;
  }

  async function handleAuthSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailValue = String(formData.get("email") ?? "");
    const passwordValue = String(formData.get("password") ?? "");
    setEmail(emailValue);
    setPassword(passwordValue);

    if (mode === "signup") {
      const nameValue = String(formData.get("name") ?? "");
      const referralValue = String(formData.get("referralCode") ?? "");
      const outcome = await action.run(() =>
        signUp({
          name: nameValue,
          email: emailValue,
          password: passwordValue,
          // Consent is now implicit — see the "By continuing..." disclaimer
          // above the signup form instead of a checkbox.
          acceptedTerms: true,
          referralCode: referralValue,
          ...(validPlan ? { planTier: validPlan } : {}),
        }),
      );
      if (outcome.outcome !== "success") {
        toast.error(NETWORK_ERROR_MESSAGE);
        return;
      }
      if (outcome.value.ok) {
        toast.success("Account created");
        setMode("verify");
      } else {
        toast.error(outcome.value.error);
      }
      return;
    }

    const outcome = await action.run(() =>
      signIn("credentials", { email: emailValue, password: passwordValue, redirect: false }),
    );
    if (outcome.outcome !== "success") {
      toast.error(NETWORK_ERROR_MESSAGE);
      return;
    }
    if (outcome.value?.error) {
      toast.error("Invalid email or password");
    } else {
      toast.success("Welcome back");
      markDeviceAuthed();
      const session = await getSession();
      router.push(session?.user?.role === "ADMIN" ? "/admin" : "/dashboard");
    }
  }

  async function handleGoogleSignIn() {
    // Google already verifies the email, so there's no OTP step to land on
    // — go straight to onboarding, carrying the referral code / pricing-page
    // plan tier through the redirect the same way the credentials signup
    // form carries them via signUp()'s arguments (see onboarding/page.tsx,
    // which reads these and attaches them to the User row before render).
    const onboardingParams = new URLSearchParams();
    if (referralCode.trim()) onboardingParams.set("ref", referralCode.trim());
    if (validPlan) onboardingParams.set("plan", validPlan);
    const query = onboardingParams.toString();

    setGooglePending(true);
    markDeviceAuthed();
    await signIn("google", { redirectTo: `/onboarding${query ? `?${query}` : ""}` });
  }

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (otp.length !== 6) return;

    const outcome = await action.run(() => verifyOtp({ email, code: otp }));
    if (outcome.outcome !== "success") {
      toast.error(NETWORK_ERROR_MESSAGE);
      return;
    }
    if (!outcome.value.ok) {
      toast.error(outcome.value.error);
      return;
    }
    toast.success("Email verified");

    const signInOutcome = await action.run(() =>
      signIn("credentials", { email, password, redirect: false }),
    );
    if (signInOutcome.outcome !== "success") {
      toast.error(NETWORK_ERROR_MESSAGE);
      return;
    }
    if (!signInOutcome.value?.error) markDeviceAuthed();
    router.push(signInOutcome.value?.error ? "/auth" : "/onboarding");
  }

  async function handleResend() {
    const outcome = await resendAction.run(() => resendOtp({ email }));
    if (outcome.outcome !== "success") {
      toast.error(NETWORK_ERROR_MESSAGE);
      return;
    }
    if (outcome.value.ok) {
      toast.success("Code resent");
    } else {
      toast.error(outcome.value.error);
    }
  }

  async function handleForgotSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const outcome = await action.run(() => forgotPassword({ email }));
    if (outcome.outcome !== "success") {
      toast.error(NETWORK_ERROR_MESSAGE);
      return;
    }
    setMode("forgot-sent");
  }

  async function handleResetSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPassword = String(formData.get("newPassword") ?? "");

    const outcome = await action.run(() => resetPassword({ token: resetToken ?? "", newPassword }));
    if (outcome.outcome !== "success") {
      toast.error(NETWORK_ERROR_MESSAGE);
      return;
    }
    if (!outcome.value.ok) {
      toast.error(outcome.value.error);
      return;
    }
    toast.success("Password reset. Please log in.");
    router.replace("/auth");
    setMode("login");
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="/demo/studio-standing-pose.jpg"
          alt="Instructor in a sunlit studio, mid-pose"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/5" />
        <Link href="/" className="absolute left-10 top-10 font-extrabold text-2xl text-white">
          <Image
            src="/flowboc-white-logo.png"
            width={100}
            height={100}
            alt="Flowboc Logo"
            className="h-6 w-auto"
          />
        </Link>
        <div className="absolute inset-x-0 bottom-0 p-10">
          <p className="max-w-sm text-2xl text-white leading-snug">
            Your practice deserves a home as calm as the work itself.
          </p>
          <p className="mt-3 text-sm text-white/70">
            Booking, payments and students — all in one gentle dashboard.
          </p>
        </div>
      </div>

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-sand/60 px-4 py-12 lg:w-1/2">
        <div className="absolute inset-0 lg:hidden">
          <Image
            src="/demo/studio-standing-pose.jpg"
            alt="Instructor in a sunlit studio, mid-pose"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-sand/75" />
        </div>

        <div className="relative w-full max-w-md">
          <Link
            href="/"
            className="flex justify-center font-extrabold text-foreground text-2xl lg:hidden"
          >
            <Image
              src="/flowboc-brand-logo.png"
              width={100}
              height={100}
              alt="Flowboc Logo"
              className="h-6 w-auto"
            />
          </Link>

          {mode === "verify" ? (
            <div className="surface mt-6 p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-clay/12">
                <MailCheck className="size-6 text-clay" />
              </div>
              <h1 className="mt-5 text-2xl">Verify your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the 6-digit code we sent to {email || "your email"}.
              </p>
              <form className="mt-6 flex flex-col items-center gap-5" onSubmit={handleVerify}>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <Button
                  type="submit"
                  variant="clay"
                  size="lg"
                  className="w-full"
                  disabled={otp.length !== 6 || action.isPending}
                >
                  {action.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />{" "}
                      {slowLabel("Verify email", "Verifying…")}
                    </>
                  ) : (
                    "Verify email"
                  )}
                </Button>
              </form>
              <button
                type="button"
                className="mt-4 text-sm text-muted-foreground underline underline-offset-4 disabled:opacity-50"
                onClick={handleResend}
                disabled={resendAction.isPending}
              >
                {slowLabel("Resend code", "Sending…", resendAction)}
              </button>
            </div>
          ) : mode === "forgot" ? (
            <div className="surface mt-6 p-8">
              <h1 className="text-2xl">Reset your password</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleForgotSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="femail">Email</Label>
                  <Input
                    id="femail"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.com"
                  />
                </div>
                <Button
                  type="submit"
                  variant="clay"
                  size="lg"
                  className="w-full"
                  disabled={action.isPending}
                >
                  {action.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />{" "}
                      {slowLabel("Send reset link", "Sending…")}
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
              <button
                type="button"
                className="mt-4 text-sm text-muted-foreground underline underline-offset-4"
                onClick={() => setMode("login")}
              >
                Back to log in
              </button>
            </div>
          ) : mode === "forgot-sent" ? (
            <div className="surface mt-6 p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/15">
                <Check className="size-6 text-success" />
              </div>
              <h1 className="mt-5 text-2xl">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                If an account exists for {email || "that address"}, we&apos;ve sent a link to reset
                your password.
              </p>
              <button
                type="button"
                className="mt-6 text-sm text-clay underline underline-offset-4"
                onClick={() => setMode("login")}
              >
                Back to log in
              </button>
            </div>
          ) : mode === "reset" ? (
            <div className="surface mt-6 p-8">
              <h1 className="text-2xl">Set a new password</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose a new password for your account.
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleResetSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <PasswordInput
                    id="newPassword"
                    name="newPassword"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="clay"
                  size="lg"
                  className="w-full"
                  disabled={action.isPending}
                >
                  {action.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />{" "}
                      {slowLabel("Reset password", "Resetting…")}
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>
              <button
                type="button"
                className="mt-4 text-sm text-muted-foreground underline underline-offset-4"
                onClick={() => {
                  router.replace("/auth");
                  setMode("login");
                }}
              >
                Back to log in
              </button>
            </div>
          ) : (
            <div className="surface mt-6 p-8">
              <h1 className="text-2xl">
                {mode === "signup" ? "Create your instructor account" : "Welcome back"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "signup"
                  ? "Your booking page takes about five minutes to set up."
                  : "Log in to your dashboard."}
              </p>

              {mode === "signup" && refParam ? (
                <p className="mt-4 rounded-lg bg-clay/10 px-3 py-2 text-xs text-clay">
                  You were referred with code <span className="font-medium">{refParam}</span> —
                  it&apos;s applied automatically.
                </p>
              ) : null}

              {mode === "signup" && (
                <p className="mt-4 text-xs text-muted-foreground">
                  By continuing, you agree to Flowboc&apos;s{" "}
                  <Link href="/terms" target="_blank" className="underline underline-offset-4">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className="underline underline-offset-4">
                    Privacy Policy
                  </Link>
                  , including how your bookings and payouts are handled.
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="mt-6 w-full"
                disabled={googlePending}
                onClick={() => void handleGoogleSignIn()}
              >
                {googlePending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Image src="/google-logo.svg" width={18} height={18} alt="" />
                )}
                Continue with Google
              </Button>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleAuthSubmit}>
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" name="name" placeholder="Sarah Boone" required />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@studio.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput id="password" name="password" placeholder="••••••••" required />
                </div>
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="refcode">Referral code (optional)</Label>
                    <Input
                      id="refcode"
                      name="referralCode"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      placeholder="e.g. SARAH20"
                    />
                  </div>
                )}
                <Button
                  type="submit"
                  variant="clay"
                  size="lg"
                  className="w-full"
                  disabled={action.isPending}
                >
                  {action.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {slowLabel(
                        mode === "signup" ? "Create account" : "Log in",
                        mode === "signup" ? "Creating account…" : "Logging in…",
                      )}
                    </>
                  ) : mode === "signup" ? (
                    "Create account"
                  ) : (
                    "Log in"
                  )}
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-muted-foreground underline underline-offset-4"
                  onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                >
                  {mode === "signup" ? "I already have an account" : "Create an account"}
                </button>
                {mode === "login" && (
                  <button
                    type="button"
                    className="text-muted-foreground underline underline-offset-4"
                    onClick={() => setMode("forgot")}
                  >
                    Forgot password
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
