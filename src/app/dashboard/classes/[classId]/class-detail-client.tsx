"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarClock,
  CalendarX2,
  Copy,
  Loader2,
  MoreHorizontal,
  Trash2,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill, paymentTone } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { bookingsForClass, money, timezoneLabel, waitlistForClass } from "@/lib/demo";
import { deadlineMinutesToLabel } from "@/lib/class-deadline";
import { useMockAction } from "@/hooks/use-mock-action";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import type { YogaClass } from "@/generated/prisma/client";
import { cancelClass, deleteClass, duplicateClass } from "../actions";

export function ClassDetailClient({ cls }: { cls: YogaClass }) {
  const router = useRouter();
  // Bookings/waitlist tables don't exist yet (a later batch) — these demo
  // lookups always return [] for a real (non-demo) class id, which is the
  // correct "no bookings yet" state for every real class right now.
  const roster = bookingsForClass(cls.id);
  const [attended, setAttended] = useState<Record<string, boolean>>(
    Object.fromEntries(roster.map((b) => [b.id, Boolean(b.attended)])),
  );
  const [waitlistEntries, setWaitlistEntries] = useState(waitlistForClass(cls.id));
  const [confirmAction, setConfirmAction] = useState<"cancel" | "delete" | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [duplicatePending, setDuplicatePending] = useState(false);

  const bookingAction = useMockAction();
  const attendanceAction = useMockAction();
  const waitlistAction = useMockAction();

  const attendedCount = Object.values(attended).filter(Boolean).length;

  async function handleDuplicate() {
    setDuplicatePending(true);
    try {
      const result = await duplicateClass(cls.id);
      if (result.ok) {
        toast.success(`Duplicated as "${cls.name} (copy)" — find it in your classes list`);
      } else {
        toast.error(result.error);
      }
    } finally {
      setDuplicatePending(false);
    }
  }

  async function handleConfirmStatusChange() {
    if (!confirmAction) return;
    setConfirmPending(true);
    try {
      const result =
        confirmAction === "cancel" ? await cancelClass(cls.id) : await deleteClass(cls.id);
      if (result.ok) {
        toast.success(confirmAction === "cancel" ? "Class cancelled" : "Class deleted");
        setConfirmAction(null);
        router.push("/dashboard/classes");
      } else {
        toast.error(result.error);
        setConfirmPending(false);
      }
    } catch {
      setConfirmPending(false);
    }
  }

  return (
    <DashboardShell>
      <Link href="/dashboard/classes" className="text-sm text-muted-foreground hover:text-clay">
        ← Back to classes
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">{cls.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatClassDate(cls, "long")} · {formatClassTime(cls)} {timezoneLabel(cls.timezone)} ·{" "}
            {cls.durationMinutes} min · {cls.location ?? "No location set"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="quiet">Add student manually</Button>
          <Button variant="ghost" asChild>
            <Link href={`/dashboard/classes/edit/${cls.id}`}>Edit class</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={duplicatePending} onClick={() => void handleDuplicate()}>
                {duplicatePending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Copy className="size-4" />
                )}
                Duplicate class
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {cls.status !== "CANCELLED" && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmAction("cancel")}
                >
                  <XCircle className="size-4" /> Cancel class
                </DropdownMenuItem>
              )}
              {cls.status === "DRAFT" && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmAction("delete")}
                >
                  <Trash2 className="size-4" /> Delete class
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="surface flex items-center gap-3 p-5">
          <Users className="size-5 text-clay" />
          <div>
            <p className="text-xs text-muted-foreground">Booked</p>
            <p className="display text-xl">0 / {cls.capacity}</p>
          </div>
        </div>
        <div className="surface flex items-center gap-3 p-5">
          <Wallet className="size-5 text-clay" />
          <div>
            <p className="text-xs text-muted-foreground">Collected</p>
            <p className="display text-xl">{money(0)}</p>
          </div>
        </div>
        <div className="surface flex items-center gap-3 p-5">
          <CalendarClock className="size-5 text-clay" />
          <div>
            <p className="text-xs text-muted-foreground">Booking deadline</p>
            <p className="text-sm font-medium">
              {deadlineMinutesToLabel(cls.deadlineMinutesBeforeStart)}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="bookings" className="mt-8">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist ({waitlistEntries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-4">
          {roster.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No bookings yet"
              body="Bookings will show up here as students book this class."
            />
          ) : (
            <div className="surface divide-y divide-border">
              {roster.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{b.student}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {b.email} · {b.source} booking
                    </p>
                  </div>
                  <StatusPill>{b.status}</StatusPill>
                  <StatusPill tone={paymentTone(b.payment)}>{b.payment}</StatusPill>
                  <span className="w-20 text-right text-sm font-medium">{money(b.amount)}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={bookingAction.pending}
                      onClick={() =>
                        bookingAction.run({ success: `Refund issued to ${b.student}` })
                      }
                    >
                      Refund
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={bookingAction.pending}
                      onClick={() =>
                        bookingAction.run({ success: `Booking cancelled for ${b.student}` })
                      }
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          {roster.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nothing to track yet"
              body="Attendance opens up once students have booked this class."
            />
          ) : (
            <div className="surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Tick everyone who showed up</p>
                <p className="text-sm">
                  {roster.length} booked · {attendedCount} attended ·{" "}
                  {roster.length - attendedCount} absent
                </p>
              </div>
              <div className="mt-4 divide-y divide-border">
                {roster.map((b) => (
                  <label
                    key={b.id}
                    className="flex cursor-pointer items-center gap-3 py-3 text-sm"
                    htmlFor={`att-${b.id}`}
                  >
                    <Checkbox
                      id={`att-${b.id}`}
                      checked={attended[b.id] ?? false}
                      onCheckedChange={(v) => setAttended({ ...attended, [b.id]: Boolean(v) })}
                    />
                    <span className={attended[b.id] ? "" : "text-muted-foreground"}>
                      {b.student}
                    </span>
                  </label>
                ))}
              </div>
              <Button
                variant="clay"
                className="mt-5"
                disabled={attendanceAction.pending}
                onClick={() => attendanceAction.run({ success: "Attendance saved" })}
              >
                {attendanceAction.pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save attendance"
                )}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="waitlist" className="mt-4">
          {waitlistEntries.length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              title="No one's waiting"
              body="Students who join the waitlist for a full class will show up here."
            />
          ) : (
            <div className="surface divide-y divide-border">
              {waitlistEntries.map((w) => (
                <div key={w.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{w.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {w.email} · joined {w.joinedAt}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="quiet"
                    disabled={waitlistAction.pending}
                    onClick={() =>
                      waitlistAction.run({
                        success: `${w.name} moved to bookings`,
                        onDone: () =>
                          setWaitlistEntries((prev) => prev.filter((e) => e.id !== w.id)),
                      })
                    }
                  >
                    Move to bookings
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "cancel" ? "Cancel this class?" : "Delete this class?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "cancel"
                ? `All ${roster.length} booked student${roster.length === 1 ? "" : "s"} will be notified and refunded.`
                : "This draft class will be permanently deleted. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Never mind
            </Button>
            <Button
              variant="destructive"
              disabled={confirmPending}
              onClick={() => void handleConfirmStatusChange()}
            >
              {confirmPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />{" "}
                  {confirmAction === "cancel" ? "Cancelling…" : "Deleting…"}
                </>
              ) : confirmAction === "cancel" ? (
                "Cancel class"
              ) : (
                "Delete class"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
