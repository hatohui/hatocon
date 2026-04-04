import { auth } from "@/auth";
import { messages } from "@/common/messages";
import {
  BadRequest,
  Forbidden,
  NotFound,
  OK,
  Unauthorized,
} from "@/common/response";
import activityRepository from "@/repositories/activity_repository";
import participationRepository from "@/repositories/participation_repository";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

/** PUT /api/participations/[id]/activities/reorder */
const PUT = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  const isMember = await participationRepository.isMember(id, session.user.id);
  if (!isMember && !session.user.isAdmin) {
    return Forbidden("You can only reorder activities in your own group");
  }

  const group = await participationRepository.getOrCreateGroupForParticipation(
    id,
    participation.userId,
  );
  if (!group) return NotFound("Could not resolve group");

  const { orderedIds } = await req.json();
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return BadRequest("orderedIds must be a non-empty array");
  }

  await activityRepository.reorder(group.id, orderedIds);
  return OK({ success: true });
};

export { PUT };
