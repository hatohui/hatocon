import { auth } from "@/auth";
import { messages } from "@/common/messages";
import {
  BadRequest,
  Conflict,
  Created,
  Forbidden,
  NotFound,
  OK,
  Unauthorized,
} from "@/common/response";
import notificationRepository from "@/repositories/notification_repository";
import participationRepository from "@/repositories/participation_repository";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/participations/[id]/join-requests — list pending requests */
const GET = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  // Must be a member of this group
  const isMember = await participationRepository.isMember(id, session.user.id);
  if (!isMember && !session.user.isAdmin) {
    return Forbidden(messages.participationGroup.notMember);
  }

  const group = await participationRepository.getOrCreateGroupForParticipation(
    id,
    participation.userId,
  );
  if (!group) return BadRequest("No group linked");

  const requests = await participationRepository.getPendingJoinRequests(
    group.id,
  );

  return OK(requests);
};

/** POST /api/participations/[id]/join-requests — request to join */
const POST = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  // Check if already a member of this group
  if (participation.groupId) {
    const existing = await participationRepository.getByUserAndGroup(
      session.user.id,
      participation.groupId,
    );
    if (existing) return Conflict(messages.participationGroup.alreadyMember);
  }

  const group = await participationRepository.getOrCreateGroupForParticipation(
    id,
    participation.userId,
  );
  if (!group) return BadRequest("No group linked");

  // Check if already requested
  const existingRequest =
    await participationRepository.getJoinRequestByGroupAndUser(
      group.id,
      session.user.id,
    );
  if (existingRequest) {
    return Conflict(messages.participationGroup.joinRequestExists);
  }

  const joinRequest = await participationRepository.createJoinRequest(
    group.id,
    session.user.id,
  );

  // Notify members of the group
  const participants = await participationRepository.getParticipantsByGroup(
    group.id,
  );
  const memberIds = participants
    .map((p) => p.userId)
    .filter((uid) => uid !== session.user.id);

  const detailed = await participationRepository.getByIdDetailed(id);
  const eventTitle = detailed?.event?.title ?? "Unknown event";

  await notificationRepository.createMany(memberIds, "JOIN_REQUEST", {
    eventId: participation.eventId,
    eventTitle,
    participationId: id,
    userId: session.user.id,
    userName: session.user.name ?? "Someone",
    joinRequestId: joinRequest.id,
  });

  return Created(joinRequest);
};

export { GET, POST };
