import { auth } from "@/auth";
import { BadRequest, Forbidden, NotFound, NoContent, OK, Unauthorized } from "@/common/response";
import eventRepository from "@/repositories/event_repository";
import { eventBaseSchema } from "@/validations/eventSchema";
import type { NextRequest } from "next/server";

const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();
  if (!session.user.isAdmin) return Forbidden();

  const { id } = await params;
  const existing = await eventRepository.getById(id);
  if (!existing || existing.isDeleted) return NotFound();

  const data = await req.json();
  const result = eventBaseSchema.partial().safeParse(data);
  if (!result.success) {
    return BadRequest(result.error.issues.map((i) => i.message).join(", "));
  }

  const updated = await eventRepository.update(id, result.data);
  return OK(updated);
};

const DELETE = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();
  if (!session.user.isAdmin) return Forbidden();

  const { id } = await params;
  const existing = await eventRepository.getById(id);
  if (!existing || existing.isDeleted) return NotFound();

  await eventRepository.softDelete(id);
  return NoContent();
};

export { PATCH, DELETE };
