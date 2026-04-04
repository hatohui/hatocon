import { auth } from "@/auth";
import { BadRequest, Created, OK, Unauthorized } from "@/common/response";
import workScheduleRepository from "@/repositories/work_schedule_repository";
import type { NextRequest } from "next/server";

const GET = async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const exceptions = await workScheduleRepository.getScheduleExceptions(
    session.user.id,
    from ? new Date(from) : undefined,
    to ? new Date(to) : undefined,
  );

  return OK(exceptions);
};

const POST = async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const body = await req.json();

  if (!body.date || typeof body.isWorkDay !== "boolean") {
    return BadRequest("date and isWorkDay are required");
  }

  const exception = await workScheduleRepository.createScheduleException(
    session.user.id,
    {
      date: new Date(body.date),
      isWorkDay: body.isWorkDay,
      reason: body.reason || undefined,
    },
  );

  return Created(exception);
};

export { GET, POST };
