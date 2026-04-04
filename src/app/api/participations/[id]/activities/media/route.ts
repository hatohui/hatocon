import { auth } from "@/auth";
import { messages } from "@/common/messages";
import { Forbidden, NotFound, OK, Unauthorized } from "@/common/response";
import activityRepository from "@/repositories/activity_repository";
import participationRepository from "@/repositories/participation_repository";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/participations/[id]/activities/media — list all media for participation's activities */
const GET = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  // Resolve group to get media
  const group = participation.groupId
    ? await participationRepository.getGroupById(participation.groupId)
    : null;
  if (!group) return OK([]);

  const { searchParams } = req.nextUrl;
  const activityId = searchParams.get("activityId") || undefined;
  const uploadedBy = searchParams.get("uploadedBy") || undefined;

  const media = await activityRepository.getAllMediaByGroup(
    group.id,
    activityId,
    uploadedBy,
  );
  return OK(media);
};

export { GET };
