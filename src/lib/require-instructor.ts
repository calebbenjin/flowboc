import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function requireInstructor() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const instructor = await prisma.instructor.findUnique({ where: { userId: session.user.id } });
  if (!instructor) throw new Error("No instructor profile for this account");
  return instructor;
}
