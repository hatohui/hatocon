/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `JobProfile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,eventId]` on the table `Participation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,from,to]` on the table `Participation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdBy` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `JobProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leaveType` to the `Participation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'UNPAID');

-- DropForeignKey
ALTER TABLE "Participation" DROP CONSTRAINT "Participation_eventId_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "JobProfile" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Participation" ADD COLUMN     "leaveType" "LeaveType" NOT NULL,
ALTER COLUMN "eventId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "JobProfile_userId_key" ON "JobProfile"("userId");

-- CreateIndex
CREATE INDEX "Participation_userId_from_to_idx" ON "Participation"("userId", "from", "to");

-- CreateIndex
CREATE UNIQUE INDEX "Participation_userId_eventId_key" ON "Participation"("userId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Participation_userId_from_to_key" ON "Participation"("userId", "from", "to");

-- AddForeignKey
ALTER TABLE "JobProfile" ADD CONSTRAINT "JobProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
