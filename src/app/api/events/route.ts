import { auth } from "@/auth";
import { BadRequest, Created, OK, Unauthorized } from "@/common/response";
import eventRepository from "@/repositories/event_repository";
import { eventSchema } from "@/validations/eventSchema";
import type { NextRequest } from "next/server";

const GET = async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const q = searchParams.get("q") ?? undefined;
  const createdBy = searchParams.get("createdBy") ?? undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const from = fromParam ? new Date(fromParam) : undefined;
  const to = toParam ? new Date(toParam) : undefined;

  if (from && isNaN(from.getTime()))
    return BadRequest("Invalid date format for 'from'");
  if (to && isNaN(to.getTime()))
    return BadRequest("Invalid date format for 'to'");

  const events = await eventRepository.getAllFiltered({
    q,
    from,
    to,
    createdBy,
    limit,
  });

  return OK(events);
};

const POST = async (req: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) {
    return Unauthorized();
  }

  const data = await req.json();
  const result = eventSchema.safeParse(data);

  if (!result.success) {
    return BadRequest(result.error.issues.map((i) => i.message).join(", "));
  }

  const event = await eventRepository.create(
    session.user.id,
    result.data,
    session.user.isAdmin ?? false,
  );

  return Created(event);
};

export { GET, POST };
