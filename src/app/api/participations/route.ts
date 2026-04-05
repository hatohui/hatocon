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
import { cacheDel } from "@/config/redis";
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

  const { from, to, eventId, leaveType, coTravelerIds, planName } = result.data;
  const groupName = planName ?? "My Plan";

  // Always check for overlapping participations first
  const overlap = await participationRepository.getOverlapping(
    session.user.id,
    from,
    to,
  );
  if (overlap) {
    return Conflict(messages.participation.overlap, {
      conflictFrom: overlap.from,
      conflictTo: overlap.to,
    });
  }

  let resolvedEventId = eventId;

  if (eventId) {
    // Case 2: event selected — validate that the chosen range overlaps the event by > 1 hour
    const event = await eventRepository.getById(eventId);
    if (!event) {
      return NotFound(messages.event.notFound);
    }

    const overlapStart = Math.max(from.getTime(), event.startAt.getTime());
    const overlapEnd = Math.min(to.getTime(), event.endAt.getTime());
    const overlapHours = (overlapEnd - overlapStart) / (1000 * 60 * 60);

    if (overlapHours <= 1) {
      return BadRequest(messages.participation.eventNoOverlap);
    }
  } else {
    // Case 1: no event — create a private event using the plan name
    const newEvent = await eventRepository.create(session.user.id, {
      title: groupName,
      startAt: from,
      endAt: to,
      visibility: "PRIVATE",
    });
    resolvedEventId = newEvent.id;
  }

  // Create a group for this participation
  const group = await participationRepository.createGroup({
    eventId: resolvedEventId ?? undefined,
    ownerId: session.user.id,
    name: groupName,
  });

  const participation = await participationRepository.create(session.user.id, {
    eventId: resolvedEventId,
    groupId: group.id,
    from,
    to,
    leaveType,
  });

  // Bust the creator's events cache (new private event or newly visible event)
  await cacheDel(`events:list:${session.user.id}`);

  // Create participations for co-travelers
  if (coTravelerIds && coTravelerIds.length > 0) {
    const validIds = coTravelerIds.filter((id) => id !== session.user.id);
    if (validIds.length > 0) {
      await participationRepository.createMany(
        validIds,
        { eventId: resolvedEventId, groupId: group.id, from, to, leaveType },
        session.user.id,
      );
      // Bust each co-traveler's cache too
      await Promise.all(validIds.map((uid) => cacheDel(`events:list:${uid}`)));
    }
  }

  return Created(participation);
};

export { GET, POST };
