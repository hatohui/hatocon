-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "EventInvitee" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventInvitee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventInvitee_userId_idx" ON "EventInvitee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventInvitee_eventId_userId_key" ON "EventInvitee"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "EventInvitee" ADD CONSTRAINT "EventInvitee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
