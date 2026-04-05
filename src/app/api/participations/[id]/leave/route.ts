import { auth } from "@/auth";
import { Forbidden, NotFound, OK, Unauthorized } from "@/common/response";
import { messages } from "@/common/messages";
import { r2 } from "@/config/r2";
import { cacheDel } from "@/config/redis";
import activityRepository from "@/repositories/activity_repository";
import notificationRepository from "@/repositories/notification_repository";
import participationRepository from "@/repositories/participation_repository";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/participations/[id]/leave
 * Leave a participation group.
 *
 * Case A — Owner leaves:
 *   - If another member exists: auto-promote the 2nd-oldest member to owner,
 *     clean up the leaving owner's data (activities, media), send GROUP_PROMOTION.
 *   - If sole member: delete the entire group (same as DELETE /group).
 *
 * Case B — Regular member leaves:
 *   - Clean up their data in the group (activities, media).
 *   - Send USER_LEFT to the group owner.
 */
const POST = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  // The requester must own this specific participation record
  if (participation.userId !== session.user.id) {
    return Forbidden("You can only leave your own participation");
  }

  if (!participation.groupId) {
    return NotFound("No group linked to this participation");
  }

  const group = await participationRepository.getGroupById(
    participation.groupId,
  );
  if (!group) return NotFound("Group not found");

  const detailed = await participationRepository.getByIdDetailed(id);
  const eventTitle = detailed?.event?.title ?? "Unknown event";

  const isOwner = group.ownerId === session.user.id;

  // ── Case A: owner is leaving ──────────────────────────────────────
  if (isOwner) {
    const nextMember = await participationRepository.getSecondOldestMember(
      group.id,
      session.user.id,
    );

    if (!nextMember) {
      // Sole owner with no members — treat as full group deletion (no notifications needed)
      const imageUrls = await participationRepository.getGroupAllMediaUrls(
        group.id,
      );
      await participationRepository.deleteEntireGroup(group.id);
      await deleteR2Objects(imageUrls);
      await cacheDel(`events:list:${session.user.id}`);
      return OK({ success: true, disbanded: true });
    }

    // Collect R2 URLs for the leaving owner's data in this group
    const imageUrls = await participationRepository.getUserMediaUrlsInGroup(
      group.id,
      session.user.id,
    );

    // Transfer ownership first
    await participationRepository.transferOwnership(
      group.id,
      nextMember.userId,
    );

    // Remove leaving owner from activities (delete their created ones, remove from involvedPeople)
    await activityRepository.removeUserFromGroup(group.id, session.user.id);

    // Delete participation images uploaded by the leaving owner
    await participationRepository.deleteUserParticipationImages(
      group.id,
      session.user.id,
    );

    // Delete the leaving owner's participation
    await participationRepository.delete(id);

    // Clean up R2
    await deleteR2Objects(imageUrls);

    // Notify the new owner
    const newOwner = await import("@/config/prisma").then(({ db }) =>
      db.user.findUnique({
        where: { id: nextMember.userId },
        select: { name: true },
      }),
    );
    await notificationRepository.create(nextMember.userId, "GROUP_PROMOTION", {
      eventTitle,
      participationId: nextMember.id,
      userId: session.user.id,
      userName: session.user.name ?? "Someone",
    });

    await Promise.all([
      cacheDel(`events:list:${session.user.id}`),
      cacheDel(`events:list:${nextMember.userId}`),
    ]);

    return OK({
      success: true,
      newOwnerId: nextMember.userId,
      newOwnerName: newOwner?.name,
    });
  }

  // ── Case B: regular member is leaving ────────────────────────────
  const imageUrls = await participationRepository.getUserMediaUrlsInGroup(
    group.id,
    session.user.id,
  );

  // Remove from activities (delete created, remove from involvedPeople)
  await activityRepository.removeUserFromGroup(group.id, session.user.id);

  // Delete participation images uploaded by the leaving member
  await participationRepository.deleteUserParticipationImages(
    group.id,
    session.user.id,
  );

  // Delete their participation
  await participationRepository.delete(id);

  // Clean up R2
  await deleteR2Objects(imageUrls);

  // Notify the group owner
  await notificationRepository.create(group.ownerId, "USER_LEFT", {
    eventTitle,
    participationId: id,
    userId: session.user.id,
    userName: session.user.name ?? "Someone",
  });

  await cacheDel(`events:list:${session.user.id}`);

  return OK({ success: true });
};

async function deleteR2Objects(urls: string[]) {
  if (urls.length === 0) return;
  const r2Base = process.env.R2_PUBLIC_URL ?? "";
  await Promise.allSettled(
    urls.map((url) => {
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

export { POST };
