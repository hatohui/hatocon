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
import { activityUpdateSchema } from "@/validations/activitySchema";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string; activityId: string }> };

/** GET /api/participations/[id]/activities/[activityId] */
const GET = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { activityId } = await ctx.params;
  const activity = await activityRepository.getById(activityId);
  if (!activity) return NotFound(messages.activity.notFound);

  return OK(activity);
};

/** PATCH /api/participations/[id]/activities/[activityId] */
const PATCH = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id, activityId } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  const isMember = await participationRepository.isMember(id, session.user.id);
  if (!isMember && !session.user.isAdmin) {
    return Forbidden("You can only edit activities in your own group");
  }

  const activity = await activityRepository.getById(activityId);
  if (!activity || activity.participationGroupId !== participation.groupId) {
    return NotFound(messages.activity.notFound);
  }

  const data = await req.json();
  const result = activityUpdateSchema.safeParse(data);
  if (!result.success) {
    return BadRequest(result.error.issues.map((i) => i.message).join(", "));
  }

  const updated = await activityRepository.update(activityId, result.data);
  return OK(updated);
};

/** DELETE /api/participations/[id]/activities/[activityId] */
const DELETE = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id, activityId } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  const isMember = await participationRepository.isMember(id, session.user.id);
  if (!isMember && !session.user.isAdmin) {
    return Forbidden("You can only delete activities in your own group");
  }

  const activity = await activityRepository.getById(activityId);
  if (!activity || activity.participationGroupId !== participation.groupId) {
    return NotFound(messages.activity.notFound);
  }

  await activityRepository.delete(activityId);
  return new NextResponse(null, { status: 204 });
};

export { GET, PATCH, DELETE };
