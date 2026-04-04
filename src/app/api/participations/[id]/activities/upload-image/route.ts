import { auth } from "@/auth";
import { messages } from "@/common/messages";
import {
  BadRequest,
  Created,
  Forbidden,
  NotFound,
  Unauthorized,
} from "@/common/response";
import { r2 } from "@/config/r2";
import participationRepository from "@/repositories/participation_repository";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

type RouteContext = { params: Promise<{ id: string }> };

/** POST /api/participations/[id]/activities/upload-image — get presigned URL for activity reference image */
const POST = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound(messages.participation.notFound);

  if (participation.userId !== session.user.id && !session.user.isAdmin) {
    return Forbidden("You can only upload images to your own participations");
  }

  const { contentType, contentLength } = await req.json();

  if (!ALLOWED_TYPES.includes(contentType)) {
    return BadRequest("Unsupported file type. Use JPEG, PNG, or WebP.");
  }
  if (contentLength && contentLength > MAX_BYTES) {
    return BadRequest("File too large. Maximum size is 10 MB.");
  }

  const ext = contentType.split("/")[1];
  const key = `activities/references/${id}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return Created({ uploadUrl, publicUrl });
};

export { POST };
