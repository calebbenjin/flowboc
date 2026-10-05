-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "videoCallDescription" TEXT,
ADD COLUMN     "videoCallEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoCallImageUrl" TEXT,
ADD COLUMN     "videoCallPrice" INTEGER,
ADD COLUMN     "videoCallTitle" TEXT;

-- CreateTable
CREATE TABLE "VideoCallBooking" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoCallBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoCallBooking_instructorId_idx" ON "VideoCallBooking"("instructorId");

-- AddForeignKey
ALTER TABLE "VideoCallBooking" ADD CONSTRAINT "VideoCallBooking_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
