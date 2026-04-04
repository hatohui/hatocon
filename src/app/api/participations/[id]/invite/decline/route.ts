import { auth } from "@/auth";
import { NotFound, OK, Unauthorized } from "@/common/response";
import { messages } from "@/common/messages";
import participationRepository from "@/repositories/participation_repository";
import notificationRepository from "@/repositories/notification_repository";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/participations/[id]/invite/decline
 * Decline an invitation. Updates the INVITED_TO_JOIN notification to INVITE_DECLINED.
 */
const POST = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const notificationId: string | undefined = body?.notificationId;

  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  if (notificationId) {
    await notificationRepository.respondToInvite(
      notificationId,
      session.user.id,
      "INVITE_DECLINED",
    );
  }

  return OK({ message: "Invitation declined" });
};

export { POST };
