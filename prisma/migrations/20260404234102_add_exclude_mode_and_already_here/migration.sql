-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "isExcludeMode" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Participation" ADD COLUMN     "isAlreadyHere" BOOLEAN NOT NULL DEFAULT false;
