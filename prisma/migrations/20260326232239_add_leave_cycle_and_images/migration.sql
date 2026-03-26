-- AlterTable
ALTER TABLE "JobProfile" ADD COLUMN     "leaveCycleStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Participation" ADD COLUMN     "createdBy" TEXT;

-- CreateTable
CREATE TABLE "ParticipationImage" (
    "id" TEXT NOT NULL,
    "participationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipationImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParticipationImage_participationId_idx" ON "ParticipationImage"("participationId");

-- AddForeignKey
ALTER TABLE "ParticipationImage" ADD CONSTRAINT "ParticipationImage_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "Participation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
