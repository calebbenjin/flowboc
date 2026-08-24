-- CreateEnum
CREATE TYPE "NewsletterSubscriberStatus" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "NewsletterCampaignStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "InstructorLink" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstructorLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" "NewsletterSubscriberStatus" NOT NULL DEFAULT 'SUBSCRIBED',
    "unsubscribeToken" TEXT NOT NULL,
    "ip" TEXT,
    "source" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterCampaign" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "status" "NewsletterCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstructorLink_instructorId_order_idx" ON "InstructorLink"("instructorId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeToken_key" ON "NewsletterSubscriber"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_instructorId_status_idx" ON "NewsletterSubscriber"("instructorId", "status");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_ip_createdAt_idx" ON "NewsletterSubscriber"("ip", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_instructorId_email_key" ON "NewsletterSubscriber"("instructorId", "email");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_instructorId_status_idx" ON "NewsletterCampaign"("instructorId", "status");

-- AddForeignKey
ALTER TABLE "InstructorLink" ADD CONSTRAINT "InstructorLink_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterCampaign" ADD CONSTRAINT "NewsletterCampaign_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
