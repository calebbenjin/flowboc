"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import posthog from "posthog-js";
import { LogOut, ChevronsUpDown, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { dashboardIcons } from "@/components/dashboard-icons";
import { useInstructor } from "@/components/InstructorProvider";
import { TrialBanner } from "@/components/TrialBanner";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { SidebarPlanCard } from "@/components/SidebarPlanCard";
import { cn } from "@/lib/utils";
import Image from "next/image";

const nav = [
  { to: "/dashboard", label: "Overview", icon: dashboardIcons.overview, mobile: true },
  { to: "/dashboard/classes", label: "Classes", icon: dashboardIcons.classes, mobile: true },
  { to: "/dashboard/offers", label: "Offers", icon: dashboardIcons.offers, mobile: false },
  { to: "/dashboard/analytics", label: "Analytics", icon: dashboardIcons.analytics, mobile: false },
  { to: "/dashboard/students", label: "Students", icon: dashboardIcons.students, mobile: true },

  {
    to: "/dashboard/booking-page",
    label: "Booking page",
    icon: dashboardIcons.bookingPage,
    mobile: false,
  },
  {
    to: "/dashboard/newsletter",
    label: "Newsletter",
    icon: dashboardIcons.newsletter,
    mobile: false,
  },
  { to: "/dashboard/referrals", label: "Referrals", icon: dashboardIcons.referrals, mobile: false },
  { to: "/dashboard/payouts", label: "Payouts", icon: dashboardIcons.payouts, mobile: false },
  { to: "/dashboard/billing", label: "Billing", icon: dashboardIcons.billing, mobile: false },
  { to: "/dashboard/profile", label: "Profile", icon: dashboardIcons.profile, mobile: false },
];

const navGroups = [
  {
    label: "Teach",
    paths: ["/dashboard", "/dashboard/classes", "/dashboard/offers", "/dashboard/students"],
  },
  {
    label: "Grow",
    paths: [
      "/dashboard/booking-page",
      "/dashboard/newsletter",
      "/dashboard/analytics",
      "/dashboard/referrals",
    ],
  },
  {
    label: "Manage",
    paths: ["/dashboard/payouts", "/dashboard/billing", "/dashboard/profile"],
  },
];

const mobileNav = nav.filter((item) => item.mobile);

function UserMenu({ compact = false }: { compact?: boolean }) {
  const instructor = useInstructor();

  function handleLogout() {
    if (
      process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
      process.env["NEXT_PUBLIC_POSTHOG_HOST"]
    ) {
      posthog.reset();
    }
    void signOut({ callbackUrl: "/auth?mode=login" });
  }

  const initials = instructor.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Open account menu for ${instructor.name}`}
          className={cn(
            "flex items-center gap-2 rounded-lg text-left transition-colors hover:bg-accent/60",
            compact ? "p-1.5" : "w-full p-2",
          )}
        >
          <Avatar className="size-8">
            {instructor.photoUrl && (
              <AvatarImage src={instructor.photoUrl} alt="" className="object-cover" />
            )}
            <AvatarFallback className="bg-clay/12 text-xs font-medium text-clay">
              {initials}
            </AvatarFallback>
          </Avatar>
          {compact ? null : (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{instructor.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {instructor.email}
                </span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} className="w-48">
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden bg-sidebar text-sidebar-foreground lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:gap-6 lg:overflow-y-auto lg:border-r lg:border-sidebar-border lg:p-6">
        <Link
          href="/dashboard"
          className="inline-flex font-extrabold text-2xl text-sidebar-foreground"
        >
          <Image
            src="/flowboc-brand-logo.png"
            width={100}
            height={100}
            alt="Flowboc Logo"
            className="h-6 w-auto"
          />
        </Link>

        <nav className="flex-1 space-y-1 mt-8 sm:pt-6">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-2 px-3 text-sm font-bold text-black border-b border-primary/20 pb-1">{group.label}</p>
              {group.paths
                .map((to) => nav.find((item) => item.to === to)!)
                .map((item) => {
                  const active =
                    item.to === "/dashboard" ? path === item.to : path.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      href={item.to}
                      aria-current={active ? "page" : undefined}
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
            </div>
          ))}
        </nav>

        <div className="space-y-4">
          <SidebarPlanCard />

          <UserMenu />
        </div>
      </aside>

      <div className="dashboard-content bg-white min-h-screen flex-1 lg:pl-64">
        <a
          href="#dashboard-main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
        >
          Skip to content
        </a>
        <main id="dashboard-main" className="mx-auto max-w-6xl px-4 py-6 pb-20 lg:px-8 lg:pb-6">
          <div className="mb-6 flex items-center justify-between gap-2 lg:hidden">
            <Link href="/dashboard" className="col-start-2 inline-flex ">
              <Image
                src="/flowboc-brand-logo.png"
                width={100}
                height={100}
                alt="Flowboc Logo"
                className="h-6 w-auto"
              />
            </Link>
            <div className="col-start-3 flex justify-end">
              <UserMenu compact />
            </div>
          </div>
          <TrialBanner />
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white backdrop-blur lg:hidden">
        <div
          className="mx-auto flex max-w-7xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {mobileNav.map((item) => {
            const active = item.to === "/dashboard" ? path === item.to : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                href={item.to}
                aria-current={active ? "page" : undefined}
                className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.68rem]"
              >
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full px-3 py-1",
                    active && "bg-clay/12",
                  )}
                >
                  <item.icon
                    className={cn("size-5", active ? "text-clay" : "text-muted-foreground")}
                  />
                </span>
                <span
                  className={active ? "font-bold text-clay" : "text-muted-foreground font-bold"}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.68rem] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay",
                  !mobileNav.some((item) =>
                    item.to === "/dashboard" ? path === item.to : path.startsWith(item.to),
                  )
                    ? "text-clay"
                    : "text-muted-foreground",
                )}
              >
                <span className="rounded-full px-3 py-1">
                  <Menu className="size-5" />
                </span>
                More
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              className="mb-2 max-h-[65dvh] w-56 overflow-y-auto"
            >
              {nav
                .filter((item) => !item.mobile)
                .map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link
                      href={item.to}
                      aria-current={path.startsWith(item.to) ? "page" : undefined}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <FeedbackWidget />
    </div>
  );
}
