import { auth } from "@/auth";
import { OK, Unauthorized } from "@/common/response";
import notificationRepository from "@/repositories/notification_repository";
import type { NextRequest } from "next/server";

const GET = async (_req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const count = await notificationRepository.getUnreadCount(session.user.id);

  return OK({ count });
};

export { GET };
