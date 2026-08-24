"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { ClassForm } from "@/components/ClassForm";
import { createClass, type ClassInput } from "../actions";

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
    coverUrl: String(formData.get("coverUrl") ?? "").trim() || null,
    recurring: formData.get("recurring") === "true",
    recurringDays: String(formData.get("recurringDays") ?? "")
      .split(",")
      .filter(Boolean),
    horizonDays: num("horizonDays", 30),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    timezone: String(formData.get("timezone") ?? "Africa/Lagos"),
    durationMinutes: num("durationMinutes", 60),
    online: formData.get("online") === "true",
    location: String(formData.get("location") ?? ""),
    capacity: num("capacity", 12),
    price: num("price", 0),
    originalPrice: optionalNum("originalPrice"),
    deadlineLabel: String(formData.get("deadline") ?? "2 hours before start"),
    cancellationPolicy: String(formData.get("cancellationPolicy") ?? ""),
  };
}

export function NewClassClient() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const intent = String(formData.get("intent") ?? "publish");

    setPending(true);
    try {
      const result = await createClass({
        ...readClassFormData(formData),
        status: intent === "draft" ? "DRAFT" : "PUBLISHED",
      });
      if (result.ok) {
        toast.success(intent === "draft" ? "Saved as draft" : "Class published");
        router.push("/dashboard/classes");
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
        <Link href="/dashboard/classes" className="text-sm text-muted-foreground hover:text-clay">
          ← Back to classes
        </Link>
        <h1 className="mt-3 text-3xl">Create a class</h1>

        <ClassForm
          primaryLabel="Publish class"
          secondaryLabel="Save as draft"
          secondarySubmits
          pending={pending}
          onSubmit={handleSubmit}
        />
      </div>
    </DashboardShell>
  );
}
