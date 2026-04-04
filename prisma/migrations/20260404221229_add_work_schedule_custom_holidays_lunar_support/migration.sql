-- AlterTable
ALTER TABLE "Holiday" ADD COLUMN     "isLunar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lunarDay" INTEGER,
ADD COLUMN     "lunarMonth" INTEGER;

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sunday" BOOLEAN NOT NULL DEFAULT false,
    "monday" BOOLEAN NOT NULL DEFAULT true,
    "tuesday" BOOLEAN NOT NULL DEFAULT true,
    "wednesday" BOOLEAN NOT NULL DEFAULT true,
    "thursday" BOOLEAN NOT NULL DEFAULT true,
    "friday" BOOLEAN NOT NULL DEFAULT true,
    "saturday" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleException" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isWorkDay" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomHoliday" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkSchedule_userId_key" ON "WorkSchedule"("userId");

-- CreateIndex
CREATE INDEX "ScheduleException_userId_date_idx" ON "ScheduleException"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleException_userId_date_key" ON "ScheduleException"("userId", "date");

-- CreateIndex
CREATE INDEX "CustomHoliday_userId_date_idx" ON "CustomHoliday"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CustomHoliday_userId_date_key" ON "CustomHoliday"("userId", "date");

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday"("date");

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomHoliday" ADD CONSTRAINT "CustomHoliday_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
