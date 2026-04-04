-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'INVITE_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'INVITE_DECLINED';

-- DropIndex
DROP INDEX "Participation_userId_eventId_key";

-- DropIndex
DROP INDEX "Participation_userId_from_to_key";

-- DropIndex
DROP INDEX "ParticipationGroup_eventId_key";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "createdBy" TEXT;
