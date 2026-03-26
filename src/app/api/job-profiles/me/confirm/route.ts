import { auth } from "@/auth";
import { NotFound, OK, Unauthorized } from "@/common/response";
import { messages } from "@/common/messages";
import { db } from "@/config/prisma";

const POST = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return Unauthorized();
  }

  const profile = await db.jobProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NotFound(messages.jobProfile.notFound);
  }

  const updated = await db.jobProfile.update({
    where: { id: profile.id },
    data: { updatedAt: new Date() },
  });

  return OK(updated);
};

export { POST };
