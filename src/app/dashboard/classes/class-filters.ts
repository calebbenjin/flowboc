import type { YogaClass } from "@/generated/prisma/client";

export type ClassFilter = "upcoming" | "drafts" | "past" | "cancelled" | "all";

export const classFilters: { value: ClassFilter; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "drafts", label: "Drafts" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All classes" },
];

export function matchesClassFilter(
  cls: Pick<YogaClass, "name" | "status" | "startAt">,
  filter: ClassFilter,
  search: string,
  now: Date,
): boolean {
  if (!cls.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
  if (filter === "all") return true;
  if (filter === "drafts") return cls.status === "DRAFT";
  if (filter === "cancelled") return cls.status === "CANCELLED";
  if (filter === "past") {
    return (
      cls.status === "COMPLETED" ||
      ((cls.status === "PUBLISHED" || cls.status === "FULL") && new Date(cls.startAt) < now)
    );
  }
  return (cls.status === "PUBLISHED" || cls.status === "FULL") && new Date(cls.startAt) >= now;
}
