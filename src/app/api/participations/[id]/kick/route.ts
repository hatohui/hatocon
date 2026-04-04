import { auth } from "@/auth";
import { messages } from "@/common/messages";
import {
  BadRequest,
  Forbidden,
  NotFound,
  OK,
  Unauthorized,
} from "@/common/response";
import notificationRepository from "@/repositories/notification_repository";
import participationRepository from "@/repositories/participation_repository";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

/** POST /api/participations/[id]/kick — remove a member from event participation */
const POST = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  const group = await participationRepository.getOrCreateGroupForParticipation(
    id,
    participation.userId,
  );
  if (!group) return BadRequest("No group linked");

  if (group.ownerId !== session.user.id && !session.user.isAdmin) {
    return Forbidden(messages.participationGroup.notOwner);
  }

  const { userId } = await req.json();
  if (!userId || typeof userId !== "string") {
    return BadRequest("userId is required");
  }

  if (userId === group.ownerId) {
    return BadRequest(messages.participationGroup.cannotKickOwner);
  }

  // Find the target's participation in this group
  const targetParticipation = await participationRepository.getByUserAndGroup(
    userId,
    group.id,
  );
  if (!targetParticipation) {
    return NotFound(messages.participationGroup.targetNotMember);
  }

  // Delete the target's participation
  await participationRepository.delete(targetParticipation.id);

  // Find event title for notification
  const detailed = await participationRepository.getByIdDetailed(id);
  const eventTitle = detailed?.event?.title ?? "Unknown event";

  // Notify the kicked user
  await notificationRepository.create(userId, "USER_KICKED", {
    eventId: participation.eventId,
    eventTitle,
    participationId: id,
  });

  return OK({ success: true });
};

export { POST };
