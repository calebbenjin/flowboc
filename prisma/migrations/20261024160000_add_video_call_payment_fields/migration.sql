-- AlterTable
ALTER TABLE "VideoCallBooking" ADD COLUMN     "amount" INTEGER,
ADD COLUMN     "currency" "CurrencyCode",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PAID',
ADD COLUMN     "paystackFee" DOUBLE PRECISION,
ADD COLUMN     "paystackReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "VideoCallBooking_paystackReference_key" ON "VideoCallBooking"("paystackReference");
