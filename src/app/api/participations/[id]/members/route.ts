import { auth } from "@/auth";
import {
  BadRequest,
  Conflict,
  NotFound,
  OK,
  Unauthorized,
} from "@/common/response";
import { messages } from "@/common/messages";
import participationRepository from "@/repositories/participation_repository";
import eventRepository from "@/repositories/event_repository";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/participations/[id]/members?search=... — search within this participation's members only */
const GET = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound("Participation not found");

  // Only members or the owner may query this
  const isMember = await participationRepository.isMember(id, session.user.id);
  if (!isMember) return Unauthorized();

  const search = req.nextUrl.searchParams.get("search") ?? "";
  const members = await participationRepository.searchMembers(id, search);
  return OK(members);
};

/** POST /api/participations/[id]/members — add a member to the same event participation */
const POST = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound("Participation not found");

  if (!participation.eventId) {
    return BadRequest("Can only add members to event-linked participations");
  }

  const { userId } = await req.json();
  if (!userId || typeof userId !== "string") {
    return BadRequest("userId is required");
  }

  // Check the event exists
  const event = await eventRepository.getById(participation.eventId);
  if (!event) return NotFound(messages.event.notFound);

  // Check for overlapping participations for this user
  const overlap = await participationRepository.getOverlapping(
    userId,
    participation.from,
    participation.to,
  );
  if (overlap) return Conflict(messages.participation.overlap);

  const newParticipation = await participationRepository.create(
    userId,
    {
      eventId: participation.eventId,
      from: participation.from,
      to: participation.to,
      leaveType: participation.leaveType,
    },
    session.user.id,
  );

  return OK(newParticipation);
};

export { GET, POST };
