-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PlanStatus" ADD VALUE 'PAST_DUE';
ALTER TYPE "PlanStatus" ADD VALUE 'CANCELED';

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "billingInterval" "BillingInterval",
ADD COLUMN     "subscriptionCode" TEXT,
ADD COLUMN     "subscriptionEmailToken" TEXT,
ADD COLUMN     "subscriptionPlanCode" TEXT,
ADD COLUMN     "subscriptionRenewsAt" TIMESTAMP(3);
