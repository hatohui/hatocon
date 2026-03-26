import { auth } from "@/auth";
import { NotFound, OK, Unauthorized } from "@/common/response";
import { messages } from "@/common/messages";
import jobProfileRepository from "@/repositories/job_profile_repository";
import participationRepository from "@/repositories/participation_repository";
import { LeaveType } from "@prisma/client";

const GET = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return Unauthorized();
  }

  const profile = await jobProfileRepository.getByUserId(session.user.id);

  if (!profile) {
    return NotFound(messages.jobProfile.notFound);
  }

  const [annualUsed, sickUsed] = await Promise.all([
    participationRepository.getSumByLeaveType(
      session.user.id,
      LeaveType.ANNUAL,
    ),
    participationRepository.getSumByLeaveType(session.user.id, LeaveType.SICK),
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

  return OK({ annual, sick });
};

export { GET };
