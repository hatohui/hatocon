import { auth } from "@/auth";
import { Forbidden, NotFound, Unauthorized } from "@/common/response";
import participationRepository from "@/repositories/participation_repository";
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

  // Only the group owner can delete
  if (image.group.ownerId !== session.user.id && !session.user.isAdmin) {
    return Forbidden("You can only delete images in groups you own");
  }

  await participationRepository.deleteImage(imageId);
  return new NextResponse(null, { status: 204 });
};

export { DELETE };
