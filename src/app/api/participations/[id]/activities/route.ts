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
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  const activities = await activityRepository.getByParticipation(id);
  return OK(activities);
};

/** POST /api/participations/[id]/activities — create activity */
const POST = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  if (participation.userId !== session.user.id && !session.user.isAdmin) {
    return Forbidden("You can only add activities to your own participations");
  }

  const data = await req.json();
  const result = activitySchema.safeParse(data);
  if (!result.success) {
    return BadRequest(result.error.issues.map((i) => i.message).join(", "));
  }

  const activity = await activityRepository.create(
    id,
    session.user.id,
    result.data,
  );
  return Created(activity);
};

export { GET, POST };
