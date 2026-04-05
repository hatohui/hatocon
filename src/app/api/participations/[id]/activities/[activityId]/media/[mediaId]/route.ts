import { auth } from "@/auth";
import { messages } from "@/common/messages";
import { Forbidden, NotFound, Unauthorized } from "@/common/response";
import { r2 } from "@/config/r2";
import activityRepository from "@/repositories/activity_repository";
import participationRepository from "@/repositories/participation_repository";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ id: string; activityId: string; mediaId: string }>;
};

/** DELETE /api/participations/[id]/activities/[activityId]/media/[mediaId] */
const DELETE = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id, mediaId } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  const media = await activityRepository.getMediaById(mediaId);
  if (!media) return NotFound("Media not found");

  // Allow deletion if user is media uploader, participation owner, or admin
  const isOwner = participation.userId === session.user.id;
  const isUploader = media.uploadedBy === session.user.id;
  if (!isOwner && !isUploader && !session.user.isAdmin) {
    return Forbidden("You can only delete your own media");
  }

  // Delete from R2
  const key = media.url.replace(`${process.env.R2_PUBLIC_URL}/`, "");
  await r2.send(
    new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }),
  );

  await activityRepository.deleteMedia(mediaId);
  return new NextResponse(null, { status: 204 });
};

export { DELETE };
