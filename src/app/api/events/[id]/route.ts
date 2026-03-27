import { auth } from "@/auth";
import {
  BadRequest,
  Forbidden,
  NotFound,
  OK,
  Unauthorized,
} from "@/common/response";
import eventRepository from "@/repositories/event_repository";
import { eventBaseSchema } from "@/validations/eventSchema";
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

  return OK(event);
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

  const updated = await eventRepository.update(id, result.data);
  return OK(updated);
};

export { GET, PATCH };
