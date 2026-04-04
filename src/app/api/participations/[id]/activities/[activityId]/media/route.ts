import { auth } from "@/auth";
import { messages } from "@/common/messages";
import {
  BadRequest,
  Created,
  Forbidden,
  NotFound,
  OK,
  Unauthorized,
} from "@/common/response";
import { r2 } from "@/config/r2";
import activityRepository from "@/repositories/activity_repository";
import participationRepository from "@/repositories/participation_repository";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

type RouteContext = {
  params: Promise<{ id: string; activityId: string }>;
};

/** GET /api/participations/[id]/activities/[activityId]/media — list media */
const GET = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { activityId } = await ctx.params;
  const activity = await activityRepository.getById(activityId);
  if (!activity) return NotFound(messages.activity.notFound);

  const media = await activityRepository.getMedia(activityId);
  return OK(media);
};

/** POST /api/participations/[id]/activities/[activityId]/media — upload */
const POST = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id, activityId } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  const activity = await activityRepository.getById(activityId);
  if (!activity || activity.participationId !== id) {
    return NotFound(messages.activity.notFound);
  }

  const { contentType, contentLength, caption } = await req.json();

  if (!ALLOWED_TYPES.includes(contentType)) {
    return BadRequest("Unsupported file type. Use JPEG, PNG, or WebP.");
  }
  if (contentLength && contentLength > MAX_BYTES) {
    return BadRequest("File too large. Maximum size is 10 MB.");
  }

  const ext = contentType.split("/")[1];
  const key = `activities/${activityId}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  const media = await activityRepository.addMedia(
    activityId,
    session.user.id,
    publicUrl,
    caption,
  );

  return Created({ uploadUrl, media });
};

export { GET, POST };
