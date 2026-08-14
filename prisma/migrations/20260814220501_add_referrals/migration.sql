-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'ACTIVE', 'CHURNED');

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "commissionRate" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "referralClickCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referralCode" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerInstructorId" TEXT NOT NULL,
    "referredInstructorId" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "plan" TEXT,
    "commissionEarned" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredInstructorId_key" ON "Referral"("referredInstructorId");

-- CreateIndex
CREATE INDEX "Referral_referrerInstructorId_idx" ON "Referral"("referrerInstructorId");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_referralCode_key" ON "Instructor"("referralCode");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerInstructorId_fkey" FOREIGN KEY ("referrerInstructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredInstructorId_fkey" FOREIGN KEY ("referredInstructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
