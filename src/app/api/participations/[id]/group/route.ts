import { auth } from "@/auth";
import { Forbidden, NotFound, OK, Unauthorized } from "@/common/response";
import { messages } from "@/common/messages";
import { r2 } from "@/config/r2";
import { cacheDel } from "@/config/redis";
import notificationRepository from "@/repositories/notification_repository";
import participationRepository from "@/repositories/participation_repository";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * DELETE /api/participations/[id]/group
 * Group owner deletes the entire participation group (and all members' data).
 * Sends PLAN_DELETED notification to every other member.
 */
const DELETE = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);
  if (!participation.groupId)
    return NotFound("No group linked to this participation");

  const group = await participationRepository.getGroupById(
    participation.groupId,
  );
  if (!group) return NotFound("Group not found");

  if (group.ownerId !== session.user.id && !session.user.isAdmin) {
    return Forbidden(messages.participationGroup.notOwner);
  }

  // Collect member user IDs (excluding the deleter) before wiping data
  const allMembers = await participationRepository.getParticipantsByGroup(
    group.id,
  );
  const otherMemberIds = allMembers
    .map((m) => m.userId)
    .filter((uid) => uid !== session.user.id);

  // Resolve event title for notifications
  const detailed = await participationRepository.getByIdDetailed(id);
  const eventTitle = detailed?.event?.title ?? "Unknown event";

  // Collect all R2 URLs before DB deletion
  const imageUrls = await participationRepository.getGroupAllMediaUrls(
    group.id,
  );

  // Hard-delete: participations + group (cascades activities/media/images/join-requests)
  await participationRepository.deleteEntireGroup(group.id);

  // Delete R2 objects (best-effort)
  if (imageUrls.length > 0) {
    const r2Base = process.env.R2_PUBLIC_URL ?? "";
    await Promise.allSettled(
      imageUrls.map((url) => {
        const key = url.startsWith(r2Base) ? url.slice(r2Base.length + 1) : url;
        return r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
          }),
        );
      }),
    );
  }

  // Notify other members
  if (otherMemberIds.length > 0) {
    await notificationRepository.createMany(
      otherMemberIds,
      "PLAN_DELETED",
      {
        eventTitle,
        userId: session.user.id,
        userName: session.user.name ?? "Someone",
      },
      session.user.id,
    );
  }

  // Bust cache for all affected users
  await Promise.all(
    [...otherMemberIds, session.user.id].map((uid) =>
      cacheDel(`events:list:${uid}`),
    ),
  );

  return OK({ success: true });
};

export { DELETE };
