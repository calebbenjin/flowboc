-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "publicPageBlockOrder" TEXT[] DEFAULT ARRAY[]::TEXT[];
