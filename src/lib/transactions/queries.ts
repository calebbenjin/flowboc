import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { requireInstructor } from "@/lib/require-instructor";
import { parseTransactionFilters, type TransactionParams } from "./filters";
import type { CurrencyCode } from "@/lib/demo";

export type TransactionRow = {
  id: string;
  type: "CLASS" | "SESSION" | "EBOOK";
  title: string;
  name: string;
  email: string;
  instructorId: string;
  instructorName: string;
  instructorEmail: string;
  currency: CurrencyCode | null;
  amount: number;
  fee: number | null;
  status: string;
  reference: string | null;
  date: Date;
};
export type TransactionResult = {
  rows: TransactionRow[];
  total: number;
  page: number;
  pageSize: number;
  errors: string[];
};

async function queryTransactions(
  params: TransactionParams,
  instructorId?: string,
): Promise<TransactionResult> {
  const filters = parseTransactionFilters(params);
  const empty = {
    rows: [],
    total: 0,
    page: filters.page,
    pageSize: filters.pageSize,
    errors: filters.errors,
  };
  if (filters.errors.length) return empty;
  const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (instructorId) conditions.push(Prisma.sql`t."instructorId" = ${instructorId}`);
  if (filters.type) conditions.push(Prisma.sql`t.type = ${filters.type}`);
  if (filters.status) conditions.push(Prisma.sql`t.status = ${filters.status}`);
  if (filters.currency) conditions.push(Prisma.sql`t.currency = ${filters.currency}`);
  if (filters.start) conditions.push(Prisma.sql`t.date >= ${filters.start}`);
  if (filters.endExclusive) conditions.push(Prisma.sql`t.date < ${filters.endExclusive}`);
  if (filters.min !== null) conditions.push(Prisma.sql`t.amount >= ${filters.min}`);
  if (filters.max !== null) conditions.push(Prisma.sql`t.amount <= ${filters.max}`);
  // strpos treats %, _ and backslashes literally instead of as LIKE wildcards.
  if (filters.q)
    conditions.push(
      Prisma.sql`strpos(lower(concat_ws(' ',t.id,t.name,t.email,t.title,t.reference,${instructorId ? Prisma.sql`''` : Prisma.sql`t."instructorName",t."instructorEmail"`})),lower(${filters.q})) > 0`,
    );
  if (!instructorId && filters.instructor)
    conditions.push(
      Prisma.sql`strpos(lower(concat_ws(' ',t."instructorId",t."instructorName",t."instructorEmail")),lower(${filters.instructor})) > 0`,
    );
  const source = Prisma.sql`
    WITH transactions AS (
      SELECT b.id, 'CLASS'::text AS type, c.name AS title, b."studentName" AS name, b."studentEmail" AS email,
        i.id AS "instructorId", i.name AS "instructorName", i.email AS "instructorEmail", b.currency::text AS currency,
        b.amount, b."paystackFee" AS fee, b."paymentStatus"::text AS status, b."paystackReference" AS reference, b."bookedAt" AS date
      FROM "Booking" b JOIN "YogaClass" c ON c.id=b."classId" JOIN "Instructor" i ON i.id=b."instructorId"
      UNION ALL
      SELECT v.id, 'SESSION'::text, COALESCE(i."videoCallTitle",'1:1 session'), v."studentName", v."studentEmail",
        i.id, i.name, i.email, v.currency::text, COALESCE(v.amount,0), v."paystackFee", v."paymentStatus"::text, v."paystackReference", v."createdAt"
      FROM "VideoCallBooking" v JOIN "Instructor" i ON i.id=v."instructorId"
      UNION ALL
      SELECT e.id, 'EBOOK'::text, COALESCE(i."ebookTitle",'Ebook'), e."buyerName", e."buyerEmail",
        i.id, i.name, i.email, e.currency::text, e.amount, e."paystackFee", e."paymentStatus"::text, e."paystackReference", e."createdAt"
      FROM "EbookPurchase" e JOIN "Instructor" i ON i.id=e."instructorId"
    ), filtered AS (SELECT * FROM transactions t WHERE ${Prisma.join(conditions, " AND ")})`;
  const order =
    filters.sort === "oldest"
      ? Prisma.sql`date ASC,type ASC,id ASC`
      : Prisma.sql`date DESC,type ASC,id ASC`;
  return prisma.$transaction(
    async (tx) => {
      const count = await tx.$queryRaw<{ total: bigint }[]>(
        Prisma.sql`${source} SELECT count(*) AS total FROM filtered`,
      );
      const total = Number(count[0]?.total ?? 0);
      const page = Math.min(filters.page, Math.max(1, Math.ceil(total / filters.pageSize)));
      const rows = await tx.$queryRaw<TransactionRow[]>(
        Prisma.sql`${source} SELECT * FROM filtered ORDER BY ${order} LIMIT ${filters.pageSize} OFFSET ${(page - 1) * filters.pageSize}`,
      );
      return { rows, total, page, pageSize: filters.pageSize, errors: [] };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}

export async function getAdminTransactions(params: TransactionParams) {
  await requireAdmin();
  return queryTransactions(params);
}
export async function getInstructorTransactions(params: TransactionParams) {
  const instructor = await requireInstructor();
  return queryTransactions(params, instructor.id);
}
