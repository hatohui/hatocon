import { auth } from "@/auth";
import { BadRequest, OK, Unauthorized } from "@/common/response";
import participationRepository from "@/repositories/participation_repository";
import type { NextRequest } from "next/server";

/** GET /api/events/[id]/my-participation — check if current user has a participation for this event */
const GET = async (
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getByUserAndEvent(
    session.user.id,
    id,
  );

  return OK(participation);
};

export { GET };
