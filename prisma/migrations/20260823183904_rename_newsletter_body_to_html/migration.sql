/*
  Warnings:

  - You are about to drop the column `bodyText` on the `NewsletterCampaign` table. All the data in the column will be lost.
  - Added the required column `bodyHtml` to the `NewsletterCampaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NewsletterCampaign" DROP COLUMN "bodyText",
ADD COLUMN     "bodyHtml" TEXT NOT NULL;
