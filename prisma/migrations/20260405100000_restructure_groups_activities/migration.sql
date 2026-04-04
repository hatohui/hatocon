-- Step 1: Remove unique constraint on eventId from ParticipationGroup (allow multiple groups per event)
ALTER TABLE "ParticipationGroup" DROP CONSTRAINT IF EXISTS "ParticipationGroup_eventId_key";

-- Step 2: Add new columns to ParticipationGroup
ALTER TABLE "ParticipationGroup" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'My Plan';
ALTER TABLE "ParticipationGroup" ALTER COLUMN "eventId" DROP NOT NULL;

-- Step 3: Create index on eventId (no longer unique)
CREATE INDEX "ParticipationGroup_eventId_idx" ON "ParticipationGroup"("eventId");

-- Step 4: Add groupId to Participation (nullable initially for data migration)
ALTER TABLE "Participation" ADD COLUMN "groupId" TEXT;

-- Step 5: Remove unique constraints from Participation that are too restrictive
ALTER TABLE "Participation" DROP CONSTRAINT IF EXISTS "Participation_userId_eventId_key";
ALTER TABLE "Participation" DROP CONSTRAINT IF EXISTS "Participation_userId_from_to_key";

-- Step 6: For each participation linked to an event, assign it to the corresponding group
UPDATE "Participation" p
SET "groupId" = pg."id"
FROM "ParticipationGroup" pg
WHERE p."eventId" = pg."eventId"
  AND p."eventId" IS NOT NULL;

-- Step 7: For participations with events but no group yet, create groups
-- (Insert groups for events that have participations but no ParticipationGroup)
INSERT INTO "ParticipationGroup" ("id", "eventId", "ownerId", "name", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  p."eventId",
  (SELECT p2."userId" FROM "Participation" p2 WHERE p2."eventId" = p."eventId" ORDER BY p2."createdAt" ASC LIMIT 1),
  'My Plan',
  NOW(),
  NOW()
FROM "Participation" p
WHERE p."eventId" IS NOT NULL
  AND p."groupId" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "ParticipationGroup" pg WHERE pg."eventId" = p."eventId")
GROUP BY p."eventId";

-- Step 7b: Now assign those newly created groups
UPDATE "Participation" p
SET "groupId" = pg."id"
FROM "ParticipationGroup" pg
WHERE p."eventId" = pg."eventId"
  AND p."eventId" IS NOT NULL
  AND p."groupId" IS NULL;

-- Step 8: Add participationGroupId to Activity (nullable initially)
ALTER TABLE "Activity" ADD COLUMN "participationGroupId" TEXT;

-- Step 9: Migrate activity data - link activities to their participation's group
UPDATE "Activity" a
SET "participationGroupId" = p."groupId"
FROM "Participation" p
WHERE a."participationId" = p."id"
  AND p."groupId" IS NOT NULL;

-- Step 10: For activities whose participation has no group (standalone), create a group
-- First, create groups for standalone participations that have activities
INSERT INTO "ParticipationGroup" ("id", "eventId", "ownerId", "name", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  p."eventId",
  p."userId",
  'My Plan',
  NOW(),
  NOW()
FROM "Participation" p
JOIN "Activity" a ON a."participationId" = p."id"
WHERE p."groupId" IS NULL
GROUP BY p."id", p."eventId", p."userId";

-- Assign groups to those participations
UPDATE "Participation" p
SET "groupId" = pg."id"
FROM "ParticipationGroup" pg
WHERE pg."ownerId" = p."userId"
  AND (pg."eventId" = p."eventId" OR (pg."eventId" IS NULL AND p."eventId" IS NULL))
  AND p."groupId" IS NULL;

-- Now link activities again
UPDATE "Activity" a
SET "participationGroupId" = p."groupId"
FROM "Participation" p
WHERE a."participationId" = p."id"
  AND a."participationGroupId" IS NULL
  AND p."groupId" IS NOT NULL;

-- Step 11: Handle ParticipationImage - add groupId, migrate data
ALTER TABLE "ParticipationImage" ADD COLUMN "groupId" TEXT;

UPDATE "ParticipationImage" pi
SET "groupId" = p."groupId"
FROM "Participation" p
WHERE pi."participationId" = p."id"
  AND p."groupId" IS NOT NULL;

-- For images where participation had no group, create groups
INSERT INTO "ParticipationGroup" ("id", "eventId", "ownerId", "name", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  p."eventId",
  p."userId",
  'My Plan',
  NOW(),
  NOW()
FROM "Participation" p
JOIN "ParticipationImage" pi ON pi."participationId" = p."id"
WHERE p."groupId" IS NULL
  AND pi."groupId" IS NULL
GROUP BY p."id", p."eventId", p."userId";

UPDATE "Participation" p
SET "groupId" = pg."id"
FROM "ParticipationGroup" pg
WHERE pg."ownerId" = p."userId"
  AND (pg."eventId" = p."eventId" OR (pg."eventId" IS NULL AND p."eventId" IS NULL))
  AND p."groupId" IS NULL;

UPDATE "ParticipationImage" pi
SET "groupId" = p."groupId"
FROM "Participation" p
WHERE pi."participationId" = p."id"
  AND pi."groupId" IS NULL
  AND p."groupId" IS NOT NULL;

-- Step 12: Now make participationGroupId NOT NULL on Activity (after all data migrated)
-- Delete orphan activities that couldn't be assigned (safety)
DELETE FROM "Activity" WHERE "participationGroupId" IS NULL;
ALTER TABLE "Activity" ALTER COLUMN "participationGroupId" SET NOT NULL;

-- Step 13: Make groupId NOT NULL on ParticipationImage (after all data migrated)
DELETE FROM "ParticipationImage" WHERE "groupId" IS NULL;
ALTER TABLE "ParticipationImage" ALTER COLUMN "groupId" SET NOT NULL;

-- Step 14: Drop old columns
ALTER TABLE "Activity" DROP COLUMN "participationId";
ALTER TABLE "ParticipationImage" DROP COLUMN "participationId";

-- Step 15: Drop old indexes and create new ones
DROP INDEX IF EXISTS "Activity_participationId_idx";
DROP INDEX IF EXISTS "Activity_participationId_from_idx";
DROP INDEX IF EXISTS "ParticipationImage_participationId_idx";

CREATE INDEX "Activity_participationGroupId_idx" ON "Activity"("participationGroupId");
CREATE INDEX "Activity_participationGroupId_from_idx" ON "Activity"("participationGroupId", "from");
CREATE INDEX "ParticipationImage_groupId_idx" ON "ParticipationImage"("groupId");
CREATE INDEX "Participation_groupId_idx" ON "Participation"("groupId");

-- Step 16: Add foreign key constraints
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_participationGroupId_fkey" FOREIGN KEY ("participationGroupId") REFERENCES "ParticipationGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParticipationImage" ADD CONSTRAINT "ParticipationImage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ParticipationGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ParticipationGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
