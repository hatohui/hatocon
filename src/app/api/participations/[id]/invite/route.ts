import { auth } from "@/auth";
import {
  BadRequest,
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

/**
 * POST /api/participations/[id]/invite
 * Send an invitation notification to a user without directly adding them.
 * - Owner/Admin: always allowed
 * - Members: allowed only when group.isMemberInviteAllowed is true
 * - Non-members: not allowed
 */
const POST = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  if (!participation.eventId) {
    return BadRequest("Can only invite to event-linked participations");
  }

  const { userId } = await req.json();
  if (!userId || typeof userId !== "string") {
    return BadRequest("userId is required");
  }

  // Must be a member (or admin) to send invitations
  const isCaller = participation.userId === session.user.id;
  const isMember =
    isCaller || (await participationRepository.isMember(id, session.user.id));
  if (!isMember && !session.user.isAdmin) {
    return Forbidden(messages.participationGroup.notMember);
  }

  // Non-owner members require isMemberInviteAllowed
  if (!session.user.isAdmin) {
    const group =
      await participationRepository.getOrCreateGroupForParticipation(
        id,
        participation.userId,
      );
    const isOwner = group ? group.ownerId === session.user.id : isCaller;
    if (!isOwner && group && !group.isMemberInviteAllowed) {
      return Forbidden(messages.participationGroup.inviteNotAllowed);
    }
  }

  // Check the event exists
  const event = await eventRepository.getById(participation.eventId);
  if (!event) return NotFound(messages.event.notFound);

  // Send the invite notification — target user must request to join to be added
  await notificationRepository.create(
    userId,
    "INVITED_TO_JOIN",
    {
      eventId: participation.eventId,
      eventTitle: event.title,
      participationId: id,
      userId: session.user.id,
      userName: session.user.name ?? "Someone",
    },
    session.user.id,
  );

  return OK({ message: "Invitation sent" });
};

export { POST };
