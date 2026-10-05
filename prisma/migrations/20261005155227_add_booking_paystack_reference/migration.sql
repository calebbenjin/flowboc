-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paystackReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_paystackReference_key" ON "Booking"("paystackReference");
