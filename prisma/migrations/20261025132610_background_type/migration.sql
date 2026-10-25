-- CreateEnum
CREATE TYPE "BackgroundType" AS ENUM ('IMAGE', 'COLOR', 'GRADIENT');

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "backgroundColor" TEXT,
ADD COLUMN     "backgroundGradientFrom" TEXT,
ADD COLUMN     "backgroundGradientTo" TEXT,
ADD COLUMN     "backgroundType" "BackgroundType" NOT NULL DEFAULT 'IMAGE';
