import { auth } from "@/auth";
import { Forbidden, OK, Unauthorized } from "@/common/response";
import { db } from "@/config/prisma";

/** GET /api/admin/stats — dashboard statistics */
const GET = async () => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();
  if (!session.user.isAdmin) return Forbidden();

  const [
    totalUsers,
    totalEvents,
    approvedEvents,
    pendingEvents,
    totalParticipations,
    totalImages,
  ] = await Promise.all([
    db.user.count(),
    db.event.count({ where: { isDeleted: false } }),
    db.event.count({ where: { isDeleted: false, isApproved: true } }),
    db.event.count({ where: { isDeleted: false, isApproved: false } }),
    db.participation.count(),
    db.participationImage.count(),
  ]);

  return OK({
    totalUsers,
    totalEvents,
    approvedEvents,
    pendingEvents,
    totalParticipations,
    totalImages,
  });
};

export { GET };
