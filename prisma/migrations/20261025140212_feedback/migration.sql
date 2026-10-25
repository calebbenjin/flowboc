-- AlterEnum
ALTER TYPE "AdminEventType" ADD VALUE 'FEEDBACK_SUBMITTED';

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_instructorId_createdAt_idx" ON "Feedback"("instructorId", "createdAt");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
