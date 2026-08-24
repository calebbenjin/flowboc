-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('TRIALING', 'ACTIVE');

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "planStatus" "PlanStatus" NOT NULL DEFAULT 'TRIALING',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);
