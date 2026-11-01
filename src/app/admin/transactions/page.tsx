import type { Metadata } from "next";
import { TransactionBrowser } from "@/components/TransactionBrowser";
import { getAdminTransactions } from "@/lib/transactions/queries";
import type { TransactionParams } from "@/lib/transactions/filters";
export const metadata: Metadata = { title: "Transactions — Flowboc admin" };
export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<TransactionParams>;
}) {
  const params = await searchParams;
  const result = await getAdminTransactions(params);
  return (
    <>
      <h1 className="text-3xl">Transactions</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Search class, 1:1 session, and ebook transactions across instructors.
      </p>
      <TransactionBrowser result={result} params={params} path="/admin/transactions" admin />
    </>
  );
}
