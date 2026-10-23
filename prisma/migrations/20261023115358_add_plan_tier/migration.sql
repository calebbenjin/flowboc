-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('STARTER', 'PRO', 'PREMIUM');

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "planTier" "PlanTier" NOT NULL DEFAULT 'STARTER';

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "tier" "PlanTier" NOT NULL DEFAULT 'PRO';

-- Grandfather every instructor that existed before tiering shipped into PRO
-- (the column default above only applies going forward, to brand-new
-- signups) so nothing they already relied on breaks on rollout.
UPDATE "Instructor" SET "planTier" = 'PRO';
