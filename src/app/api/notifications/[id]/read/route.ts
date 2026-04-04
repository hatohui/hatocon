import { auth } from "@/auth";
import { Forbidden, NotFound, OK, Unauthorized } from "@/common/response";
import { messages } from "@/common/messages";
import notificationRepository from "@/repositories/notification_repository";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const PATCH = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const notification = await notificationRepository.getById(id);
  if (!notification) return NotFound(messages.notification.notFound);
  if (notification.userId !== session.user.id) return Forbidden();

  await notificationRepository.markAsRead(id, session.user.id);

  return OK({ success: true });
};

export { PATCH };
