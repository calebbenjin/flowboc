-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'WAITLIST');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('ONLINE', 'MANUAL');

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "studentPhone" TEXT,
    "emergencyContact" TEXT,
    "notes" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reservationExpiresAt" TIMESTAMP(3),
    "source" "BookingSource" NOT NULL DEFAULT 'ONLINE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Booking_classId_idx" ON "Booking"("classId");

-- CreateIndex
CREATE INDEX "Booking_instructorId_idx" ON "Booking"("instructorId");

-- CreateIndex
CREATE INDEX "Booking_studentEmail_idx" ON "Booking"("studentEmail");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_classId_email_key" ON "WaitlistEntry"("classId", "email");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_classId_fkey" FOREIGN KEY ("classId") REFERENCES "YogaClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_classId_fkey" FOREIGN KEY ("classId") REFERENCES "YogaClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
