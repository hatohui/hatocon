import { auth } from "@/auth";
import { NotFound, OK, Unauthorized } from "@/common/response";
import { messages } from "@/common/messages";
import jobProfileRepository from "@/repositories/job_profile_repository";

const GET = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return Unauthorized();
  }

  const profile = await jobProfileRepository.getByUserId(session.user.id);

  if (!profile) {
    return NotFound(messages.jobProfile.notFound);
  }

  return OK(profile);
};

export { GET };
