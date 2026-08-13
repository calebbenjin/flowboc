"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Check, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { forgotPassword, resendOtp, resetPassword, signUp, verifyOtp } from "./actions";

type Mode = "signup" | "login" | "verify" | "forgot" | "forgot-sent" | "reset";

export function AuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");
  const resetToken = searchParams.get("token");

  const [mode, setMode] = useState<Mode>(resetToken ? "reset" : "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [referralCode, setReferralCode] = useState(refParam ?? "");
  const [pending, setPending] = useState(false);

  async function handleAuthSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailValue = String(formData.get("email") ?? "");
    const passwordValue = String(formData.get("password") ?? "");
    setEmail(emailValue);
    setPassword(passwordValue);

    setPending(true);
    try {
      if (mode === "signup") {
        const nameValue = String(formData.get("name") ?? "");
        const referralValue = String(formData.get("referralCode") ?? "");
        const result = await signUp({
          name: nameValue,
          email: emailValue,
          password: passwordValue,
          referralCode: referralValue,
        });
        if (result.ok) {
          toast.success("Account created");
          setMode("verify");
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await signIn("credentials", {
          email: emailValue,
          password: passwordValue,
          redirect: false,
        });
        if (result?.error) {
          toast.error("Invalid email or password");
        } else {
          toast.success("Welcome back");
          router.push("/dashboard");
        }
      }
    } finally {
      setPending(false);
    }
  }

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (otp.length !== 6) return;

    setPending(true);
    try {
      const result = await verifyOtp({ email, code: otp });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Email verified");

      const signInResult = await signIn("credentials", { email, password, redirect: false });
      router.push(signInResult?.error ? "/auth" : "/onboarding");
    } finally {
      setPending(false);
    }
  }

  async function handleResend() {
    const result = await resendOtp({ email });
    if (result.ok) {
      toast.success("Code resent");
    } else {
      toast.error(result.error);
    }
  }

  async function handleForgotSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      await forgotPassword({ email });
      setMode("forgot-sent");
    } finally {
      setPending(false);
    }
  }

  async function handleResetSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPassword = String(formData.get("newPassword") ?? "");

    setPending(true);
    try {
      const result = await resetPassword({ token: resetToken ?? "", newPassword });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Password reset. Please log in.");
      router.replace("/auth");
      setMode("login");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand/60 px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center font-extrabold text-foreground text-2xl">
          flowbuk
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
                disabled={otp.length !== 6 || pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Verifying…
                  </>
                ) : (
                  "Verify email"
                )}
              </Button>
            </form>
            <button
              type="button"
              className="mt-4 text-sm text-muted-foreground underline underline-offset-4"
              onClick={handleResend}
            >
              Resend code
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
              <Button type="submit" variant="clay" size="lg" className="w-full" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Sending…
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
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" variant="clay" size="lg" className="w-full" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Resetting…
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
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
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
              <Button type="submit" variant="clay" size="lg" className="w-full" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {mode === "signup" ? "Creating account…" : "Logging in…"}
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
  );
}
