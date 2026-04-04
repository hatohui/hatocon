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
import notificationRepository from "@/repositories/notification_repository";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/participations/[id]/invite/accept
 * Accept an invitation. [id] is the inviter's participation ID from the notification.
 * Creates a new participation for the current user in the same group/event.
 */
const POST = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const notificationId: string | undefined = body?.notificationId;

  const template = await participationRepository.getById(id);
  if (!template) return NotFound(messages.participation.notFound);

  if (!template.eventId) {
    return BadRequest("Invitation is not linked to an event");
  }

  // Check not already a member
  const alreadyMember = await participationRepository.isMember(
    id,
    session.user.id,
  );
  if (alreadyMember) {
    return Conflict(messages.participationGroup.alreadyMember);
  }

  const event = await eventRepository.getById(template.eventId);
  if (!event) return NotFound(messages.event.notFound);

  // Check for date overlap
  const overlap = await participationRepository.getOverlapping(
    session.user.id,
    template.from,
    template.to,
  );
  if (overlap) return Conflict(messages.participation.overlap);

  // Get the group so we can link the new participation to it
  const group = await participationRepository.getOrCreateGroupForParticipation(
    id,
    template.userId,
  );

  const newParticipation = await participationRepository.create(
    session.user.id,
    {
      eventId: template.eventId,
      groupId: group?.id ?? template.groupId ?? undefined,
      from: template.from,
      to: template.to,
      leaveType: template.leaveType,
    },
    session.user.id,
  );

  // Update only the specific invite notification if provided, otherwise fall back to first match
  if (notificationId) {
    await notificationRepository.respondToInvite(
      notificationId,
      session.user.id,
      "INVITE_ACCEPTED",
    );
  }

  return OK(newParticipation);
};

export { POST };
