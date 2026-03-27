import { auth } from "@/auth";
import { Forbidden, NotFound, Unauthorized } from "@/common/response";
import participationRepository from "@/repositories/participation_repository";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

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

export { DELETE };
