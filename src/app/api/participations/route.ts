import { auth } from "@/auth";
import { messages } from "@/common/messages";
import {
  BadRequest,
  Conflict,
  Created,
  NotFound,
  OK,
  Unauthorized,
} from "@/common/response";
import eventRepository from "@/repositories/event_repository";
import participationRepository from "@/repositories/participation_repository";
import { participationSchema } from "@/validations/participationSchema";
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

  const participations = await participationRepository.getByUserId(
    session.user.id,
    from,
    to,
  );

  return OK(participations);
};

const POST = async (req: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) {
    return Unauthorized();
  }

  const data = await req.json();
  const result = participationSchema.safeParse(data);

  if (!result.success) {
    return BadRequest(result.error.issues.map((i) => i.message).join(", "));
  }

  const { from, to, eventId, leaveType, coTravelerIds } = result.data;

  // If linked to an event, validate participation falls within event bounds
  if (eventId) {
    const event = await eventRepository.getById(eventId);
    if (!event) {
      return NotFound(messages.event.notFound);
    }
    if (from < event.startAt || to > event.endAt) {
      return BadRequest(messages.participation.outOfEventBounds);
    }
  }

  // Check for overlapping participations
  const overlap = await participationRepository.getOverlapping(
    session.user.id,
    from,
    to,
  );
  if (overlap) {
    return Conflict(messages.participation.overlap);
  }

  const participation = await participationRepository.create(
    session.user.id,
    { eventId, from, to, leaveType },
  );

  // Create participations for co-travelers
  if (coTravelerIds && coTravelerIds.length > 0) {
    const validIds = coTravelerIds.filter((id) => id !== session.user.id);
    if (validIds.length > 0) {
      await participationRepository.createMany(
        validIds,
        { eventId, from, to, leaveType },
        session.user.id,
      );
    }
  }

  return Created(participation);
};

export { GET, POST };
