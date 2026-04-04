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

type RouteContext = {
  params: Promise<{ id: string; requestId: string }>;
};

/** POST /api/participations/[id]/join-requests/[requestId]/reject */
const POST = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id, requestId } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  // Must be a member
  const isMember = await participationRepository.isMember(id, session.user.id);
  if (!isMember && !session.user.isAdmin) {
    return Forbidden(messages.participationGroup.notMember);
  }

  const joinRequest = await participationRepository.getJoinRequest(requestId);
  if (!joinRequest) {
    return NotFound(messages.participationGroup.joinRequestNotFound);
  }
  if (joinRequest.status !== "PENDING") {
    return BadRequest("Join request already processed");
  }

  await participationRepository.updateJoinRequestStatus(requestId, "REJECTED");

  const detailed = await participationRepository.getByIdDetailed(id);
  const eventTitle = detailed?.event?.title ?? "Unknown event";

  // Notify the requester
  await notificationRepository.create(
    joinRequest.userId,
    "JOIN_REQUEST_REJECTED",
    {
      eventId: participation.eventId,
      eventTitle,
      participationId: id,
    },
  );

  return OK({ success: true });
};

export { POST };
