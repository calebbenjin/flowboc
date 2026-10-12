-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "interval" "BillingInterval" NOT NULL,
    "price" INTEGER NOT NULL,
    "paystackPlanCode" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionPlan_currency_interval_active_idx" ON "SubscriptionPlan"("currency", "interval", "active");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_paystackPlanCode_idx" ON "SubscriptionPlan"("paystackPlanCode");
