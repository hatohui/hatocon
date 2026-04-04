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
import { db } from "@/config/prisma";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

/** POST /api/participations/[id]/transfer — transfer ownership */
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

  if (group.ownerId !== session.user.id) {
    return Forbidden(messages.participationGroup.notOwner);
  }

  const { userId } = await req.json();
  if (!userId || typeof userId !== "string") {
    return BadRequest("userId is required");
  }

  if (userId === session.user.id) {
    return BadRequest(messages.participationGroup.cannotTransferToSelf);
  }

  // Verify target is a member of this group
  const targetParticipation = participation.groupId
    ? await participationRepository.getByUserAndGroup(
        userId,
        participation.groupId,
      )
    : participation.eventId
      ? await participationRepository.getByUserAndEvent(
          userId,
          participation.eventId,
        )
      : null;
  if (!targetParticipation) {
    return NotFound(messages.participationGroup.targetNotMember);
  }

  await participationRepository.transferOwnership(group.id, userId);

  // Get names for notification
  const newOwner = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const detailed = await participationRepository.getByIdDetailed(id);
  const eventTitle = detailed?.event?.title ?? "Unknown event";

  // Notify the new owner
  await notificationRepository.create(userId, "OWNERSHIP_TRANSFERRED", {
    eventId: participation.eventId,
    eventTitle,
    participationId: id,
    userId: session.user.id,
    userName: session.user.name ?? "Someone",
  });

  return OK({ success: true });
};

export { POST };
