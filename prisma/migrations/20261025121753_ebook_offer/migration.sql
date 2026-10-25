-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "ebookCoverUrl" TEXT,
ADD COLUMN     "ebookDescription" TEXT,
ADD COLUMN     "ebookEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ebookFileUrl" TEXT,
ADD COLUMN     "ebookPrice" INTEGER,
ADD COLUMN     "ebookTitle" TEXT;

-- CreateTable
CREATE TABLE "EbookPurchase" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paystackReference" TEXT,
    "paystackFee" DOUBLE PRECISION,
    "downloadToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EbookPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EbookPurchase_paystackReference_key" ON "EbookPurchase"("paystackReference");

-- CreateIndex
CREATE UNIQUE INDEX "EbookPurchase_downloadToken_key" ON "EbookPurchase"("downloadToken");

-- CreateIndex
CREATE INDEX "EbookPurchase_instructorId_idx" ON "EbookPurchase"("instructorId");

-- AddForeignKey
ALTER TABLE "EbookPurchase" ADD CONSTRAINT "EbookPurchase_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
