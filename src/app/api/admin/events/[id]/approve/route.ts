import { auth } from "@/auth";
import { Forbidden, NotFound, OK, Unauthorized } from "@/common/response";
import eventRepository from "@/repositories/event_repository";
import type { NextRequest } from "next/server";

const POST = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();
  if (!session.user.isAdmin) return Forbidden();

  const { id } = await params;
  const existing = await eventRepository.getById(id);
  if (!existing || existing.isDeleted) return NotFound();

  const approved = await eventRepository.approve(id);
  return OK(approved);
};

export { POST };
