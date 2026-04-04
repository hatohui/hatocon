import { auth } from "@/auth";
import {
  BadRequest,
  Created,
  Forbidden,
  NotFound,
  OK,
  Unauthorized,
} from "@/common/response";
import { r2 } from "@/config/r2";
import participationRepository from "@/repositories/participation_repository";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/participations/[id]/images — list images for a participation's group */
const GET = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound("Participation not found");

  const group = await participationRepository.getOrCreateGroupForParticipation(
    id,
    participation.userId,
  );

  const isMember = session?.user?.id
    ? await participationRepository.isMember(id, session.user.id)
    : false;
  const isAdmin = session?.user?.isAdmin ?? false;

  if (!isMember && !isAdmin) {
    // Non-members: only allowed if group is public AND media is publicly visible
    if (!group?.isPublic || !group?.isMediaPublicVisible) {
      return session?.user?.id
        ? Forbidden("Media is not available")
        : Unauthorized();
    }
  }

  // Members/admins: also blocked if media flag is off... no, members always see media
  if (!group) return OK([]);

  const images = await participationRepository.getImages(group.id);
  return OK(images);
};

/** POST /api/participations/[id]/images — get presigned upload URL, then save record */
const POST = async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const participation = await participationRepository.getById(id);
  if (!participation) return NotFound("Participation not found");

  const isMember = await participationRepository.isMember(id, session.user.id);
  if (!isMember) {
    return Forbidden("You can only upload images to groups you belong to");
  }

  const group = await participationRepository.getOrCreateGroupForParticipation(
    id,
    participation.userId,
  );
  if (!group) return BadRequest("Could not resolve group");

  const { contentType, contentLength, caption } = await req.json();

  if (!ALLOWED_TYPES.includes(contentType)) {
    return BadRequest("Unsupported file type. Use JPEG, PNG, or WebP.");
  }
  if (contentLength && contentLength > MAX_BYTES) {
    return BadRequest("File too large. Maximum size is 10 MB.");
  }

  const ext = contentType.split("/")[1];
  const key = `groups/${group.id}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  const image = await participationRepository.addImage(
    group.id,
    publicUrl,
    caption,
  );

  return Created({ uploadUrl, image });
};

export { GET, POST };
