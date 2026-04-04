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

  const holidays = await workScheduleRepository.getCustomHolidays(
    session.user.id,
    from ? new Date(from) : undefined,
    to ? new Date(to) : undefined,
  );

  return OK(holidays);
};

const POST = async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const body = await req.json();

  if (!body.date || !body.name) {
    return BadRequest("date and name are required");
  }

  const holiday = await workScheduleRepository.createCustomHoliday(
    session.user.id,
    {
      date: new Date(body.date),
      name: body.name,
    },
  );

  return Created(holiday);
};

export { GET, POST };
