import { auth } from "@/auth";
import {
  BadRequest,
  Conflict,
  Forbidden,
  NotFound,
  OK,
  Unauthorized,
} from "@/common/response";
import { messages } from "@/common/messages";
import notificationRepository from "@/repositories/notification_repository";
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

  // Check if invite is allowed (via group)
  const group = await participationRepository.getOrCreateGroupForParticipation(
    id,
    participation.userId,
  );
  if (group && !group.isMemberInviteAllowed) {
    // Only owner can add members when invite is disabled
    if (group.ownerId !== session.user.id && !session.user.isAdmin) {
      return Forbidden(messages.participationGroup.inviteNotAllowed);
    }
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
      eventId: participation.eventId ?? undefined,
      groupId: participation.groupId ?? undefined,
      from: participation.from,
      to: participation.to,
      leaveType: participation.leaveType,
    },
    session.user.id,
  );

  // Notify the invited user
  await notificationRepository.create(userId, "INVITED_TO_JOIN", {
    eventId: participation.eventId,
    eventTitle: event.title,
    participationId: id,
    userId: session.user.id,
    userName: session.user.name ?? "Someone",
  });

  return OK(newParticipation);
};

export { GET, POST };
