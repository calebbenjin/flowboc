"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { ClassForm, type ClassFormInitial } from "@/components/ClassForm";
import { utcToZonedDateTime } from "@/lib/timezone";
import type { YogaClass } from "@/generated/prisma/client";
import { updateClass, type ClassInput } from "../../actions";
import { deadlineMinutesToLabel } from "@/lib/class-deadline";

function toFormInitial(cls: YogaClass): ClassFormInitial {
  const { date, time } = utcToZonedDateTime(cls.startAt, cls.timezone);
  return {
    name: cls.name,
    type: cls.type ?? "",
    description: cls.description ?? "",
    coverUrl: cls.coverUrl,
    recurring: cls.recurringDays.length > 0,
    recurringDays: cls.recurringDays,
    date,
    time,
    timezone: cls.timezone,
    durationMinutes: cls.durationMinutes,
    online: cls.mode === "ONLINE",
    location: cls.location ?? "",
    capacity: cls.capacity,
    price: cls.price,
    originalPrice: cls.originalPrice,
    deadlineMinutesBeforeStart: cls.deadlineMinutesBeforeStart,
    cancellationPolicy: cls.cancellationPolicy ?? "",
  };
}

function readClassFormData(formData: FormData): Omit<ClassInput, "status"> {
  const num = (key: string, fallback = 0) => {
    const raw = formData.get(key);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : fallback;
  };
  const optionalNum = (key: string) => {
    const raw = formData.get(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  return {
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? ""),
    description: String(formData.get("description") ?? ""),
    recurring: formData.get("recurring") === "true",
    recurringDays: String(formData.get("recurringDays") ?? "")
      .split(",")
      .filter(Boolean),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    timezone: String(formData.get("timezone") ?? "Africa/Lagos"),
    durationMinutes: num("durationMinutes", 60),
    online: formData.get("online") === "true",
    location: String(formData.get("location") ?? ""),
    capacity: num("capacity", 12),
    price: num("price", 0),
    originalPrice: optionalNum("originalPrice"),
    deadlineLabel: String(formData.get("deadline") ?? deadlineMinutesToLabel(120)),
    cancellationPolicy: String(formData.get("cancellationPolicy") ?? ""),
  };
}

export function EditClassClient({ cls }: { cls: YogaClass }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setPending(true);
    try {
      const result = await updateClass(cls.id, {
        ...readClassFormData(formData),
        status: cls.status,
      });
      if (result.ok) {
        toast.success("Class updated");
        router.push(`/dashboard/classes/${cls.id}`);
      } else {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/dashboard/classes/${cls.id}`}
          className="text-sm text-muted-foreground hover:text-clay"
        >
          ← Back to class
        </Link>
        <h1 className="mt-3 text-3xl">Edit class</h1>

        <ClassForm
          initial={toFormInitial(cls)}
          primaryLabel="Save changes"
          secondaryLabel="Cancel"
          pending={pending}
          onSecondary={() => router.push(`/dashboard/classes/${cls.id}`)}
          onSubmit={handleSubmit}
        />
      </div>
    </DashboardShell>
  );
}
