import { auth } from "@/auth";
import { Forbidden, OK, Unauthorized } from "@/common/response";
import participationRepository from "@/repositories/participation_repository";
import type { NextRequest } from "next/server";

/** GET /api/admin/participations — list all participations */
const GET = async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();
  if (!session.user.isAdmin) return Forbidden();

  const userId = req.nextUrl.searchParams.get("userId") ?? undefined;
  const eventId = req.nextUrl.searchParams.get("eventId") ?? undefined;

  const participations = await participationRepository.getAllAdmin({
    userId,
    eventId,
  });

  return OK(participations);
};

export { GET };
