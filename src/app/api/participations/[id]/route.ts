import { auth } from "@/auth";
import {
  BadRequest,
  Forbidden,
  NotFound,
  OK,
  Unauthorized,
} from "@/common/response";
import participationRepository from "@/repositories/participation_repository";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import zod from "zod";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/participations/[id] — get participation detail */
const GET = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();

  const { id } = await ctx.params;
  const participation = await participationRepository.getByIdDetailed(id);
  if (!participation) return NotFound("Participation not found");

  // If not logged in, only allow if the group is public
  const isPublic = participation.group?.isPublic ?? false;
  if (!session?.user?.id && !isPublic) return Unauthorized();

  // Get co-participants from the group if exists
  let participants: Awaited<
    ReturnType<typeof participationRepository.getParticipantsByGroup>
  > = [];
  let group = participation.group;

  if (participation.groupId) {
    participants = await participationRepository.getParticipantsByGroup(
      participation.groupId,
    );
  } else if (participation.eventId) {
    // Fallback: get or create group
    const rawGroup =
      await participationRepository.getOrCreateGroupForParticipation(
        id,
        participation.userId,
      );
    if (rawGroup) {
      group = { ...rawGroup, images: [] };
      participants = await participationRepository.getParticipantsByGroup(
        rawGroup.id,
      );
    }
  }

  // Strip data from response for non-members based on visibility settings
  const isMember =
    session?.user?.id &&
    participants.some(
      (p: { userId: string }) => p.userId === session!.user!.id,
    );
  const isAdmin = session?.user?.isAdmin ?? false;
  if (!isMember && !isAdmin && group && !group.isMediaPublicVisible) {
    group = { ...group, images: [] };
  }
  if (!isMember && !isAdmin && group && !group.isMemberListPublicVisible) {
    participants = [];
  }

  return OK({ ...participation, participants, group });
};

/** DELETE /api/participations/[id] — delete own participation */
const DELETE = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound("Participation not found");

  if (participation.userId !== session.user.id && !session.user.isAdmin) {
    return Forbidden("You can only delete your own participations");
  }

  await participationRepository.delete(id);
  return new NextResponse(null, { status: 204 });
};

const datesUpdateSchema = zod.object({
  from: zod.coerce.date().optional(),
  to: zod.coerce.date().optional(),
});

/** PATCH /api/participations/[id] — update arrival / departure dates */
const PATCH = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound("Participation not found");

  if (participation.userId !== session.user.id && !session.user.isAdmin) {
    return Forbidden("You can only edit your own participation");
  }

  const body = await req.json();
  const parsed = datesUpdateSchema.safeParse(body);
  if (!parsed.success) return BadRequest(parsed.error.issues[0]?.message);

  const from = parsed.data.from ?? participation.from;
  const to = parsed.data.to ?? participation.to;

  if (to <= from) return BadRequest("Departure must be after arrival");

  const updated = await participationRepository.updateDates(id, { from, to });
  return OK(updated);
};

export { GET, DELETE, PATCH };
