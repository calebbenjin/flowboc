"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Banknote,
  CreditCard,
  ReceiptText,
  LayoutDashboard,
  LogOut,
  MessageCircleHeart,
  Share2,
  Tag,
} from "lucide-react";
import posthog from "posthog-js";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/transactions", label: "Transactions", icon: ReceiptText },
  { to: "/admin/billing", label: "Billing", icon: CreditCard },
  { to: "/admin/referrals", label: "Referrals", icon: Share2 },
  { to: "/admin/referral-payouts", label: "Referral payouts", icon: Banknote },
  { to: "/admin/feedback", label: "Feedback", icon: MessageCircleHeart },
  { to: "/admin/pricing", label: "Pricing", icon: Tag },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { data: session } = useSession();

  function handleLogout() {
    if (
      process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
      process.env["NEXT_PUBLIC_POSTHOG_HOST"]
    ) {
      posthog.reset();
    }
    void signOut({ callbackUrl: "/auth?mode=login" });
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden bg-sidebar text-sidebar-foreground lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:gap-6 lg:overflow-y-auto lg:border-r lg:border-sidebar-border lg:p-6">
        <Link
          href="/admin/overview"
          className="inline-flex font-extrabold text-2xl text-sidebar-foreground"
        >
          flowboc admin
        </Link>

        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const active = path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                href={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-soft"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3">
          {session?.user?.email && (
            <p className="truncate px-1 text-xs text-sidebar-foreground/60">{session.user.email}</p>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" /> Log out
          </button>
        </div>
      </aside>

      <div className="min-h-screen flex-1 bg-white lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link
              href="/admin/overview"
              className="inline-flex font-extrabold text-foreground text-2xl"
            >
              flowboc admin
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-medium text-destructive"
            >
              Log out
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
