-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterEnum
ALTER TYPE "PlanStatus" ADD VALUE 'COMPED';

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "compNote" TEXT,
ADD COLUMN     "compedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
