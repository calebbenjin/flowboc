-- CreateEnum
CREATE TYPE "PageLayout" AS ENUM ('CLASSIC', 'COMPACT', 'COVER_GRID');

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "backgroundImageUrl" TEXT,
ADD COLUMN     "pageLayout" "PageLayout" NOT NULL DEFAULT 'CLASSIC',
ADD COLUMN     "themeColor" TEXT NOT NULL DEFAULT '#6355ff';
