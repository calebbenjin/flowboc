import { prisma } from "@/lib/db";

export type AdminFeedbackRow = {
  id: string;
  instructorName: string;
  instructorEmail: string;
  message: string;
  createdAt: Date;
};

export async function getAllFeedback(): Promise<AdminFeedbackRow[]> {
  const rows = await prisma.feedback.findMany({
    include: { instructor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    instructorName: r.instructor.name,
    instructorEmail: r.instructor.email,
    message: r.message,
    createdAt: r.createdAt,
  }));
}
