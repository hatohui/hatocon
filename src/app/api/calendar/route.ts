import { auth } from "@/auth";
import { BadRequest, OK, Unauthorized } from "@/common/response";
import eventRepository from "@/repositories/event_repository";
import participationRepository from "@/repositories/participation_repository";
import type { NextRequest } from "next/server";

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

  const [events, participations] = await Promise.all([
    eventRepository.getInRange(from, to),
    participationRepository.getByUserId(session.user.id, from, to),
  ]);

  return OK({ events, participations });
};

export { GET };
