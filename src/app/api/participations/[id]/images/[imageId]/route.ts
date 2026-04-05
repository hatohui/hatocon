import { auth } from "@/auth";
import { Forbidden, NotFound, Unauthorized } from "@/common/response";
import { r2 } from "@/config/r2";
import participationRepository from "@/repositories/participation_repository";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string; imageId: string }> };

/** DELETE /api/participations/[id]/images/[imageId] — delete an image */
const DELETE = async (_req: NextRequest, ctx: RouteContext) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { imageId } = await ctx.params;

  const image = await participationRepository.getImageById(imageId);
  if (!image) return NotFound("Image not found");

  // Group owner, the uploader themselves, or admin can delete
  const isOwner = image.group.ownerId === session.user.id;
  const isUploader = image.uploadedBy === session.user.id;
  if (!isOwner && !isUploader && !session.user.isAdmin) {
    return Forbidden("You can only delete your own images");
  }

  // Delete from R2
  const key = image.url.replace(`${process.env.R2_PUBLIC_URL}/`, "");
  await r2.send(
    new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }),
  );

  await participationRepository.deleteImage(imageId);
  return new NextResponse(null, { status: 204 });
};

export { DELETE };
