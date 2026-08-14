"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import {
  CalendarDays,
  LayoutDashboard,
  Users,
  UserRound,
  ExternalLink,
  LineChart,
  Gift,
  Landmark,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInstructor } from "@/components/InstructorProvider";
import { siteHost } from "@/lib/site";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { to: "/dashboard/classes", label: "Classes", icon: CalendarDays, mobile: true },
  { to: "/dashboard/analytics", label: "Analytics", icon: LineChart, mobile: true },
  { to: "/dashboard/students", label: "Students", icon: Users, mobile: true },
  { to: "/dashboard/referrals", label: "Referrals", icon: Gift, mobile: false },
  { to: "/dashboard/payouts", label: "Payouts", icon: Landmark, mobile: false },
  { to: "/dashboard/profile", label: "Profile", icon: UserRound, mobile: true },
];

const mobileNav = nav.filter((item) => item.mobile);

function UserMenu({ compact = false }: { compact?: boolean }) {
  const instructor = useInstructor();

  function handleLogout() {
    void signOut({ callbackUrl: "/auth" });
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
          className={cn(
            "flex items-center gap-2 rounded-lg text-left transition-colors hover:bg-accent/60",
            compact ? "p-1.5" : "w-full p-2",
          )}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-clay/12 text-xs font-medium text-clay">
            {initials}
          </span>
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
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile">Profile</Link>
        </DropdownMenuItem>
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
  const instructor = useInstructor();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <Link href="/" className="inline-flex font-extrabold text-foreground text-2xl">
            flowbuk
          </Link>
          <nav className="mt-8 space-y-1">
            {nav.map((item) => {
              const active = item.to === "/dashboard" ? path === item.to : path.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="surface mt-8 p-4">
            <p className="text-xs text-muted-foreground">Your booking page</p>
            <p className="mt-1 truncate text-sm font-medium">
              {siteHost}/{instructor.slug}
            </p>
            <Link
              href={`/${instructor.slug}`}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-clay hover:underline"
            >
              View live page <ExternalLink className="size-3" />
            </Link>
          </div>

          <div className="mt-4">
            <UserMenu />
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link href="/" className="inline-flex font-extrabold text-foreground text-2xl">
              flowbuk
            </Link>
            <div className="flex items-center gap-3">
              <Link href={`/${instructor.slug}`} className="text-xs font-medium text-clay">
                Booking page
              </Link>
              <UserMenu compact />
            </div>
          </div>
          {children}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
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
                <span className={active ? "font-medium text-clay" : "text-muted-foreground"}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
