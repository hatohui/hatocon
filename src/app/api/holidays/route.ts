import { auth } from "@/auth";
import { OK, Unauthorized } from "@/common/response";
import workScheduleRepository from "@/repositories/work_schedule_repository";
import type { NextRequest } from "next/server";

const GET = async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from || !to) {
    return OK([]);
  }

  const holidays = await workScheduleRepository.getHolidays(
    new Date(from),
    new Date(to),
  );

  return OK(holidays);
};

export { GET };
