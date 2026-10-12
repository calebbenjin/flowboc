-- Clean cutover to Startbutton: the only SubscriptionPlan rows in this table
-- point to retired Paystack plan codes with zero live subscribers behind
-- them (confirmed before this migration), so they're cleared rather than
-- backfilled for the new NOT NULL columns.
DELETE FROM "SubscriptionPlan";

-- SubscriptionPlan: swap Paystack's plan code for Startbutton's plan code,
-- plus its hosted checkout link (reused per-plan rather than minted per
-- transaction like Paystack's authorization_url was).
DROP INDEX "SubscriptionPlan_paystackPlanCode_idx";
ALTER TABLE "SubscriptionPlan" DROP COLUMN "paystackPlanCode";
ALTER TABLE "SubscriptionPlan" ADD COLUMN "providerPlanCode" TEXT NOT NULL;
ALTER TABLE "SubscriptionPlan" ADD COLUMN "checkoutLink" TEXT NOT NULL;
CREATE INDEX "SubscriptionPlan_providerPlanCode_idx" ON "SubscriptionPlan"("providerPlanCode");

-- Instructor: Startbutton's cancel-subscriber endpoint only needs a
-- subscriber id, not a Paystack-style email token.
ALTER TABLE "Instructor" RENAME COLUMN "subscriptionCode" TO "subscriptionProviderId";
ALTER TABLE "Instructor" DROP COLUMN "subscriptionEmailToken";
