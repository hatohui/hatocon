import { auth } from "@/auth";
import {
  BadRequest,
  Forbidden,
  NotFound,
  OK,
  Unauthorized,
} from "@/common/response";
import { db } from "@/config/prisma";
import { r2 } from "@/config/r2";
import { cacheDelPattern } from "@/config/redis";
import eventRepository from "@/repositories/event_repository";
import notificationRepository from "@/repositories/notification_repository";
import { eventBaseSchema } from "@/validations/eventSchema";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { NextRequest } from "next/server";

type Context = { params: Promise<{ id: string }> };

const GET = async (_req: NextRequest, ctx: Context) => {
  const session = await auth();
  const { id } = await ctx.params;

  const event = await eventRepository.getById(id);
  if (!event || event.isDeleted) return NotFound();

  // Private events: only owner, invitees, or admins can view
  if (event.visibility === "PRIVATE") {
    const userId = session?.user?.id;
    const isAdmin = session?.user?.isAdmin;
    const isOwner = userId === event.createdBy;
    const isInvitee = event.invitees.some((i) => i.userId === userId);
    if (!isOwner && !isInvitee && !isAdmin) return NotFound();
  }

  const inviteeIds = event.invitees.map((i) => i.userId);
  const inviteeUsers =
    inviteeIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: inviteeIds } },
          omit: { password: true },
          orderBy: { name: "asc" },
        })
      : [];

  return OK({
    ...event,
    inviteeUsers,
  });
};

const PATCH = async (req: NextRequest, ctx: Context) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const event = await eventRepository.getById(id);
  if (!event || event.isDeleted) return NotFound();

  const isOwner = event.createdBy === session.user.id;
  const isAdmin = session.user.isAdmin;
  if (!isOwner && !isAdmin) return Forbidden();

  const data = await req.json();
  const result = eventBaseSchema.partial().safeParse(data);
  if (!result.success) {
    return BadRequest(result.error.issues.map((i) => i.message).join(", "));
  }

  const updatePayload: typeof result.data & { isApproved?: boolean } = {
    ...result.data,
  };

  // Non-admin users changing private -> public must go through approval again.
  if (
    !isAdmin &&
    event.visibility === "PRIVATE" &&
    result.data.visibility === "PUBLIC"
  ) {
    updatePayload.isApproved = false;
  }

  // Private events are immediately visible to owner/invitees.
  if (result.data.visibility === "PRIVATE") {
    updatePayload.isApproved = true;
  }

  const updated = await eventRepository.update(id, updatePayload);
  await cacheDelPattern("events:*");
  return OK(updated);
};

const DELETE = async (_req: NextRequest, ctx: Context) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await ctx.params;
  const event = await eventRepository.getById(id);
  if (!event || event.isDeleted) return NotFound();

  const isOwner = event.createdBy === session.user.id;
  const isAdmin = session.user.isAdmin;
  if (!isOwner && !isAdmin) return Forbidden();

  // Collect all R2 image URLs before deleting records
  const imageUrls = await eventRepository.getImageUrls(id);

  // Gather all unique user IDs who had a participation in this event (exclude the deleter)
  const participantUserIds = await db.participation
    .findMany({
      where: { eventId: id, userId: { not: session.user.id } },
      select: { userId: true },
      distinct: ["userId"],
    })
    .then((rows) => rows.map((r) => r.userId));

  // Hard delete the event and all child records
  await eventRepository.hardDelete(id);

  // Delete R2 objects after DB cleanup (best-effort, fire-and-forget errors won't roll back)
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

  // Notify all participants that the event was deleted
  if (participantUserIds.length > 0) {
    await notificationRepository.createMany(
      participantUserIds,
      "EVENT_DELETED",
      { eventId: id, eventTitle: event.title },
      session.user.id,
    );
  }

  await cacheDelPattern("events:*");
  return OK({ id });
};

export { GET, PATCH, DELETE };
