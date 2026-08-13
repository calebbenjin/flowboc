-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT;

-- CreateIndex
CREATE INDEX "User_passwordResetTokenHash_idx" ON "User"("passwordResetTokenHash");
