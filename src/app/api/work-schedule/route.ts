import { auth } from "@/auth";
import { BadRequest, OK, Unauthorized } from "@/common/response";
import workScheduleRepository from "@/repositories/work_schedule_repository";
import type { NextRequest } from "next/server";

const GET = async () => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const schedule = await workScheduleRepository.getByUserId(session.user.id);

  // Return default schedule if none exists
  return OK(
    schedule ?? {
      sunday: false,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
    },
  );
};

const PUT = async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const body = await req.json();
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;

  for (const day of days) {
    if (typeof body[day] !== "boolean") {
      return BadRequest(`${day} must be a boolean`);
    }
  }

  const schedule = await workScheduleRepository.upsert(session.user.id, {
    sunday: body.sunday,
    monday: body.monday,
    tuesday: body.tuesday,
    wednesday: body.wednesday,
    thursday: body.thursday,
    friday: body.friday,
    saturday: body.saturday,
  });

  return OK(schedule);
};

export { GET, PUT };
