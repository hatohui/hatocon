import { auth } from "@/auth";
import { BadRequest, OK, Unauthorized } from "@/common/response";
import participationRepository from "@/repositories/participation_repository";
import type { HeatmapEntry } from "@/types/participation.d";
import type { NextRequest } from "next/server";

/**
 * Expands a participation range into individual calendar dates and accumulates
 * intensity (fractional days) per date.
 */
function expandToHeatmap(from: Date, to: Date, map: Map<string, number>): void {
  const totalMs = to.getTime() - from.getTime();
  const totalDays = totalMs / (1000 * 60 * 60 * 24);

  // Iterate each calendar day that overlaps the participation window
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(to);

  while (cursor < end) {
    const dayStart = new Date(cursor);
    const dayEnd = new Date(cursor);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const overlapStart = Math.max(from.getTime(), dayStart.getTime());
    const overlapEnd = Math.min(to.getTime(), dayEnd.getTime());
    const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24);

    if (overlapDays > 0) {
      const key = cursor.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + overlapDays);
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}

const GET = async (req: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) {
    return Unauthorized();
  }

  const { searchParams } = req.nextUrl;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  if (!fromParam || !toParam) {
    return BadRequest(
      "Query params 'from' and 'to' are required (ISO date strings)",
    );
  }

  const from = new Date(fromParam);
  const to = new Date(toParam);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return BadRequest("Invalid date format for 'from' or 'to'");
  }

  const participations = await participationRepository.getByUserId(
    session.user.id,
    from,
    to,
  );

  const intensityMap = new Map<string, number>();

  for (const p of participations) {
    expandToHeatmap(p.from, p.to, intensityMap);
  }

  const heatmap: HeatmapEntry[] = Array.from(intensityMap.entries())
    .map(([date, intensity]) => ({ date, intensity }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return OK(heatmap);
};

export { GET };
