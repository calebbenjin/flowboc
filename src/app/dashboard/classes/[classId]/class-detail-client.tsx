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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { money } from "@/lib/demo";
import { deadlineMinutesToLabel } from "@/lib/class-deadline";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { timezoneLabel } from "@/lib/demo";
import type { Booking, WaitlistEntry, YogaClass } from "@/generated/prisma/client";
import { cancelClass, deleteClass, duplicateClass } from "../actions";
import { addStudentManually, cancelBooking, markAttendance, promoteWaitlistEntry } from "./actions";

function AddStudentDialog({
  classId,
  open,
  onOpenChange,
  onAdded,
}: {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setPending(true);
    try {
      const result = await addStudentManually(classId, {
        studentName: String(formData.get("name") ?? ""),
        studentEmail: String(formData.get("email") ?? ""),
        studentPhone: String(formData.get("phone") ?? ""),
        paid: formData.get("paid") === "on",
      });
      if (result.ok) {
        toast.success("Student added");
        onAdded();
      } else {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add student manually</DialogTitle>
          <DialogDescription>For cash, bank transfer, or off-platform bookings.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="space-y-2">
            <Label htmlFor="asd-name">Full name</Label>
            <Input id="asd-name" name="name" required placeholder="Sarah Johnson" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asd-email">Email</Label>
            <Input id="asd-email" name="email" type="email" required placeholder="sarah@mail.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asd-phone">Phone (optional)</Label>
            <Input id="asd-phone" name="phone" placeholder="+234 803 000 0000" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox id="asd-paid" name="paid" />
            Already paid
          </label>
          <Button type="submit" variant="clay" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Adding…
              </>
            ) : (
              "Add student"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ClassDetailClient({
  cls,
  bookings,
  waitlist,
}: {
  cls: YogaClass;
  bookings: Booking[];
  waitlist: WaitlistEntry[];
}) {
  const router = useRouter();
  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED");
  const collected = confirmedBookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + b.amount, 0);

  const [attended, setAttended] = useState<Record<string, boolean>>(
    Object.fromEntries(confirmedBookings.map((b) => [b.id, b.attended])),
  );
  const [confirmAction, setConfirmAction] = useState<"cancel" | "delete" | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [duplicatePending, setDuplicatePending] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [attendancePending, setAttendancePending] = useState(false);
  const [cancelingBookingId, setCancelingBookingId] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

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

  async function handleSaveAttendance() {
    const changed = confirmedBookings.filter((b) => attended[b.id] !== b.attended);
    if (changed.length === 0) {
      toast.success("Attendance saved");
      return;
    }
    setAttendancePending(true);
    try {
      await Promise.all(changed.map((b) => markAttendance(b.id, attended[b.id] ?? false)));
      toast.success("Attendance saved");
      router.refresh();
    } finally {
      setAttendancePending(false);
    }
  }

  async function handleCancelBooking(bookingId: string) {
    setCancelingBookingId(bookingId);
    try {
      const result = await cancelBooking(bookingId);
      if (result.ok) {
        toast.success("Booking cancelled");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setCancelingBookingId(null);
    }
  }

  async function handlePromote(entryId: string, name: string) {
    setPromotingId(entryId);
    try {
      const result = await promoteWaitlistEntry(entryId);
      if (result.ok) {
        toast.success(`${name} moved to bookings`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setPromotingId(null);
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
          <Button variant="quiet" onClick={() => setAddStudentOpen(true)}>
            Add student manually
          </Button>
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
            <p className="display text-xl">
              {confirmedBookings.length} / {cls.capacity}
            </p>
          </div>
        </div>
        <div className="surface flex items-center gap-3 p-5">
          <Wallet className="size-5 text-clay" />
          <div>
            <p className="text-xs text-muted-foreground">Collected</p>
            <p className="display text-xl">{money(collected)}</p>
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
          <TabsTrigger value="waitlist">Waitlist ({waitlist.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-4">
          {bookings.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No bookings yet"
              body="Bookings will show up here as students book this class."
            />
          ) : (
            <div className="surface divide-y divide-border">
              {bookings.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{b.studentName}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {b.studentEmail} · {b.source.toLowerCase()} booking
                    </p>
                  </div>
                  <StatusPill>{b.status.toLowerCase()}</StatusPill>
                  <StatusPill tone={paymentTone(b.paymentStatus.toLowerCase())}>
                    {b.paymentStatus.toLowerCase()}
                  </StatusPill>
                  <span className="w-20 text-right text-sm font-medium">{money(b.amount)}</span>
                  {b.status === "CONFIRMED" && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={cancelingBookingId === b.id}
                        onClick={() => void handleCancelBooking(b.id)}
                      >
                        {cancelingBookingId === b.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Cancel"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          {confirmedBookings.length === 0 ? (
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
                  {confirmedBookings.length} booked · {attendedCount} attended ·{" "}
                  {confirmedBookings.length - attendedCount} absent
                </p>
              </div>
              <div className="mt-4 divide-y divide-border">
                {confirmedBookings.map((b) => (
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
                      {b.studentName}
                    </span>
                  </label>
                ))}
              </div>
              <Button
                variant="clay"
                className="mt-5"
                disabled={attendancePending}
                onClick={() => void handleSaveAttendance()}
              >
                {attendancePending ? (
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
          {waitlist.length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              title="No one's waiting"
              body="Students who join the waitlist for a full class will show up here."
            />
          ) : (
            <div className="surface divide-y divide-border">
              {waitlist.map((w) => (
                <div key={w.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{w.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {w.email} · joined {w.joinedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="quiet"
                    disabled={promotingId === w.id}
                    onClick={() => void handlePromote(w.id, w.name)}
                  >
                    {promotingId === w.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Move to bookings"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddStudentDialog
        classId={cls.id}
        open={addStudentOpen}
        onOpenChange={setAddStudentOpen}
        onAdded={() => {
          setAddStudentOpen(false);
          router.refresh();
        }}
      />

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
                ? `All ${confirmedBookings.length} booked student${confirmedBookings.length === 1 ? "" : "s"} will be notified and refunded.`
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
