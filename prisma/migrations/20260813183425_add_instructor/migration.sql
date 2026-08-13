-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('NGN', 'USD', 'GBP', 'EUR', 'ZAR', 'KES');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'FACEBOOK', 'TWITTER', 'WHATSAPP', 'LINKEDIN');

-- CreateEnum
CREATE TYPE "PayoutProvider" AS ENUM ('STRIPE', 'PAYSTACK');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('NOT_CONNECTED', 'PENDING', 'CONNECTED', 'RESTRICTED');

-- CreateTable
CREATE TABLE "Instructor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "photoUrl" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "consultationLink" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currency" "CurrencyCode" NOT NULL DEFAULT 'NGN',
    "onboardingCompletedAt" TIMESTAMP(3),
    "payoutProvider" "PayoutProvider" NOT NULL DEFAULT 'STRIPE',
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "payoutAccountId" TEXT,
    "payoutBankLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorSocial" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "handle" TEXT NOT NULL,

    CONSTRAINT "InstructorSocial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_userId_key" ON "Instructor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_slug_key" ON "Instructor"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorSocial_instructorId_platform_key" ON "InstructorSocial"("instructorId", "platform");

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorSocial" ADD CONSTRAINT "InstructorSocial_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
