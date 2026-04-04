import { auth } from "@/auth";
import { Forbidden, OK, Unauthorized } from "@/common/response";
import participationRepository from "@/repositories/participation_repository";
import type { NextRequest } from "next/server";

/** GET /api/admin/groups?search=&eventId=&page=&pageSize= */
const GET = async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();
  if (!session.user.isAdmin) return Forbidden();

  const p = req.nextUrl.searchParams;
  const search = p.get("search") ?? undefined;
  const eventId = p.get("eventId") ?? undefined;
  const page = Math.max(1, parseInt(p.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(p.get("pageSize") ?? "20", 10)),
  );

  const { total, groups } = await participationRepository.getAllGroupsAdmin({
    search,
    eventId,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return OK({ total, page, pageSize, groups });
};

export { GET };
