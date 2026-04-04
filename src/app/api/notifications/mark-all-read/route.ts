import { auth } from "@/auth";
import { OK, Unauthorized } from "@/common/response";
import notificationRepository from "@/repositories/notification_repository";
import type { NextRequest } from "next/server";

const POST = async (_req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  await notificationRepository.markAllAsRead(session.user.id);

  return OK({ success: true });
};

export { POST };
