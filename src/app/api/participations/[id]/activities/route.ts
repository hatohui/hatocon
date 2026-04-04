import { auth } from "@/auth";
import { messages } from "@/common/messages";
import {
  BadRequest,
  Created,
  Forbidden,
  NotFound,
  OK,
  Unauthorized,
} from "@/common/response";
import activityRepository from "@/repositories/activity_repository";
import participationRepository from "@/repositories/participation_repository";
import { activitySchema } from "@/validations/activitySchema";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/participations/[id]/activities — list activities */
const GET = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  // Resolve group to get activities
  const group = await participationRepository.getOrCreateGroupForParticipation(
    id,
    participation.userId,
  );
  if (!group) return OK([]);

  const isMember = session?.user?.id
    ? await participationRepository.isMember(id, session.user.id)
    : false;
  const isAdmin = session?.user?.isAdmin ?? false;

  // Non-members are blocked when isActivityPublicVisible is false; returns 404 per settings description
  if (!isMember && !isAdmin && !group.isActivityPublicVisible) {
    return NotFound(messages.participation.notFound);
  }

  const activities = await activityRepository.getByGroup(group.id);
  return OK(activities);
};

/** POST /api/participations/[id]/activities — create activity */
const POST = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  // Check membership (must be a group member)
  const isMember = await participationRepository.isMember(id, session.user.id);
  if (!isMember && !session.user.isAdmin) {
    return Forbidden("You can only add activities to your own group");
  }

  const group = await participationRepository.getOrCreateGroupForParticipation(
    id,
    participation.userId,
  );
  if (!group) return NotFound("Could not resolve group");

  const data = await req.json();
  const result = activitySchema.safeParse(data);
  if (!result.success) {
    return BadRequest(result.error.issues.map((i) => i.message).join(", "));
  }

  const activity = await activityRepository.create(
    group.id,
    session.user.id,
    result.data,
  );
  return Created(activity);
};

export { GET, POST };
