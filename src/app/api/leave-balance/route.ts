import { auth } from "@/auth";
import { NotFound, OK, Unauthorized } from "@/common/response";
import { messages } from "@/common/messages";
import jobProfileRepository from "@/repositories/job_profile_repository";
import participationRepository from "@/repositories/participation_repository";
import { LeaveType } from "@prisma/client";
import { addYears } from "date-fns";

const GET = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return Unauthorized();
  }

  const profile = await jobProfileRepository.getByUserId(session.user.id);

  if (!profile) {
    return NotFound(messages.jobProfile.notFound);
  }

  // Determine current leave cycle based on leaveCycleStart
  const cycleAnchor = profile.leaveCycleStart;
  const now = new Date();
  let cycleFrom = new Date(cycleAnchor);
  // Advance the cycle start year until it's the current cycle
  while (addYears(cycleFrom, 1) <= now) {
    cycleFrom = addYears(cycleFrom, 1);
  }
  const cycleTo = addYears(cycleFrom, 1);

  const [annualUsed, sickUsed] = await Promise.all([
    participationRepository.getSumByLeaveType(
      session.user.id,
      LeaveType.ANNUAL,
      cycleFrom,
      cycleTo,
    ),
    participationRepository.getSumByLeaveType(
      session.user.id,
      LeaveType.SICK,
      cycleFrom,
      cycleTo,
    ),
  ]);

  const annual = {
    total: profile.daysOfLeave,
    used: annualUsed,
    remaining: profile.daysOfLeave - annualUsed,
  };

  const sick = {
    total: profile.daysOfSickLeave,
    used: sickUsed,
    remaining: profile.daysOfSickLeave - sickUsed,
  };

  return OK({ annual, sick, cycleFrom, cycleTo });
};

export { GET };
