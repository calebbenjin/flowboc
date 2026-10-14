-- CreateEnum
CREATE TYPE "AdminEventType" AS ENUM ('INSTRUCTOR_SIGNED_UP', 'SUBSCRIPTION_ACTIVATED', 'SUBSCRIPTION_CANCELED', 'TRIAL_EXTENDED', 'COMP_GRANTED', 'CONTACT_MESSAGE');

-- CreateTable
CREATE TABLE "AdminActivityEvent" (
    "id" TEXT NOT NULL,
    "type" "AdminEventType" NOT NULL,
    "message" TEXT NOT NULL,
    "instructorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminActivityEvent_createdAt_idx" ON "AdminActivityEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AdminActivityEvent_instructorId_idx" ON "AdminActivityEvent"("instructorId");

-- AddForeignKey
ALTER TABLE "AdminActivityEvent" ADD CONSTRAINT "AdminActivityEvent_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
