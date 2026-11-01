-- Preserve the existing visible newsletter button for current instructors.
ALTER TABLE "Instructor" ADD COLUMN "newsletterEnabled" BOOLEAN NOT NULL DEFAULT true;
