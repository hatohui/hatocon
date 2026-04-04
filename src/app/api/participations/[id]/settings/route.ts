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
import { participationGroupSettingsSchema } from "@/validations/participationSchema";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/participations/[id]/settings — get group settings */
const GET = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  const group = await participationRepository.getOrCreateGroupForParticipation(
    id,
    participation.userId,
  );
  if (!group) return NotFound("Could not resolve group");

  return OK(group);
};

/** PATCH /api/participations/[id]/settings — update group settings (owner only) */
const PATCH = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  const group = await participationRepository.getOrCreateGroupForParticipation(
    id,
    participation.userId,
  );
  if (!group) return NotFound("Could not resolve group");

  if (group.ownerId !== session.user.id && !session.user.isAdmin) {
    return Forbidden(messages.participationGroup.notOwner);
  }

  const body = await req.json();
  const result = participationGroupSettingsSchema.safeParse(body);
  if (!result.success) {
    return BadRequest(result.error.issues.map((i) => i.message).join(", "));
  }

  const updated = await participationRepository.updateGroupSettings(
    group.id,
    result.data,
  );

  return OK(updated);
};

export { GET, PATCH };
