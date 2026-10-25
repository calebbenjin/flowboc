-- CreateEnum
CREATE TYPE "ReferralPayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminEventType" ADD VALUE 'REFERRAL_PAYOUT_REQUESTED';
ALTER TYPE "AdminEventType" ADD VALUE 'REFERRAL_PAYOUT_APPROVED';
ALTER TYPE "AdminEventType" ADD VALUE 'REFERRAL_PAYOUT_REJECTED';

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "paystackTransferRecipientCode" TEXT;

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "payoutRequestId" TEXT;

-- CreateTable
CREATE TABLE "ReferralPayoutRequest" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "ReferralPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "paystackTransferCode" TEXT,
    "paystackTransferReference" TEXT,
    "failureReason" TEXT,

    CONSTRAINT "ReferralPayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralPayoutRequest_paystackTransferReference_key" ON "ReferralPayoutRequest"("paystackTransferReference");

-- CreateIndex
CREATE INDEX "ReferralPayoutRequest_instructorId_idx" ON "ReferralPayoutRequest"("instructorId");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_payoutRequestId_fkey" FOREIGN KEY ("payoutRequestId") REFERENCES "ReferralPayoutRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralPayoutRequest" ADD CONSTRAINT "ReferralPayoutRequest_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
