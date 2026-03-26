import { auth } from "@/auth";
import { messages } from "@/common/messages";
import { BadRequest, Created, OK, Unauthorized } from "@/common/response";
import eventRepository from "@/repositories/event_repository";
import { eventSchema } from "@/validations/eventSchema";
import type { NextRequest } from "next/server";

const GET = async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const createdBy = searchParams.get("createdBy") ?? undefined;

  if (!fromParam || !toParam) {
    return BadRequest(
      "Query params 'from' and 'to' are required (ISO date strings)",
    );
  }

  const from = new Date(fromParam);
  const to = new Date(toParam);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return BadRequest("Invalid date format for 'from' or 'to'");
  }

  const events = await eventRepository.getInRange(from, to, createdBy);

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

  const event = await eventRepository.create(session.user.id, result.data);

  return Created(event);
};

export { GET, POST };
