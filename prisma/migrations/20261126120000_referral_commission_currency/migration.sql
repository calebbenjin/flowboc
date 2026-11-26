-- Commission currency tracking for local-currency subscriptions.
ALTER TABLE "Referral" ADD COLUMN "commissionCurrency" "CurrencyCode",
ADD COLUMN "bonusSourceAmount" INTEGER,
ADD COLUMN "bonusSourceCurrency" "CurrencyCode",
ADD COLUMN "bonusFxRate" DOUBLE PRECISION,
ADD COLUMN "bonusCreditedAt" TIMESTAMP(3);

-- Existing credited bonuses keep their current meaning: the amount as
-- displayed, in the referrer's currency, with no conversion. joinedAt
-- stands in for the credit time, which was never recorded.
UPDATE "Referral" r
SET "commissionCurrency" = i."currency",
    "bonusSourceAmount" = r."commissionEarned",
    "bonusSourceCurrency" = i."currency",
    "bonusFxRate" = 1,
    "bonusCreditedAt" = r."joinedAt"
FROM "Instructor" i
WHERE i."id" = r."referrerInstructorId" AND r."commissionEarned" > 0;

-- Existing payout requests were always paid in the referrer's currency.
ALTER TABLE "ReferralPayoutRequest" ADD COLUMN "currency" "CurrencyCode";
UPDATE "ReferralPayoutRequest" p
SET "currency" = i."currency"
FROM "Instructor" i
WHERE i."id" = p."instructorId";
ALTER TABLE "ReferralPayoutRequest" ALTER COLUMN "currency" SET NOT NULL;
