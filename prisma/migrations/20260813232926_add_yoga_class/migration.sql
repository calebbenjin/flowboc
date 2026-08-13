-- CreateEnum
CREATE TYPE "ClassMode" AS ENUM ('IN_PERSON', 'ONLINE');

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'FULL', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "YogaClass" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "seriesId" TEXT,
    "name" TEXT NOT NULL,
    "coverUrl" TEXT,
    "type" TEXT,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "mode" "ClassMode" NOT NULL,
    "location" TEXT,
    "price" INTEGER NOT NULL,
    "originalPrice" INTEGER,
    "capacity" INTEGER NOT NULL,
    "status" "ClassStatus" NOT NULL DEFAULT 'DRAFT',
    "recurringLabel" TEXT,
    "recurringDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deadlineMinutesBeforeStart" INTEGER NOT NULL DEFAULT 120,
    "cancellationPolicy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YogaClass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YogaClass_instructorId_idx" ON "YogaClass"("instructorId");

-- CreateIndex
CREATE INDEX "YogaClass_seriesId_idx" ON "YogaClass"("seriesId");

-- AddForeignKey
ALTER TABLE "YogaClass" ADD CONSTRAINT "YogaClass_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
