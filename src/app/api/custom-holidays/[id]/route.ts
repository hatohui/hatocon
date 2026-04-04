import { auth } from "@/auth";
import { NoContent, NotFound, Unauthorized } from "@/common/response";
import workScheduleRepository from "@/repositories/work_schedule_repository";

const DELETE = async (
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const { id } = await params;
  const result = await workScheduleRepository.deleteCustomHoliday(
    id,
    session.user.id,
  );

  if (result.count === 0) return NotFound("Holiday not found");
  return NoContent();
};

export { DELETE };
