import { auth } from "@/auth";
import { messages } from "@/common/messages";
import {
  BadRequest,
  Conflict,
  Created,
  OK,
  Unauthorized,
} from "@/common/response";
import jobProfileRepository from "@/repositories/job_profile_repository";
import { isAdminAsync } from "@/validations/isAdminAsync";
import { jobProfileSchema } from "@/validations/jobProfileSchema";
import type { NextRequest } from "next/server";

const GET = async () => {
  const isAdmin = await isAdminAsync();

  if (!isAdmin) {
    return Unauthorized();
  }

  const profiles = await jobProfileRepository.getAll();

  return OK(profiles);
};

const POST = async (req: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) {
    return Unauthorized();
  }

  const existing = await jobProfileRepository.getByUserId(session.user.id);

  if (existing) {
    return Conflict(messages.jobProfile.alreadyExists);
  }

  const data = await req.json();
  if (data.leaveCycleStart && typeof data.leaveCycleStart === "string") {
    data.leaveCycleStart = new Date(data.leaveCycleStart);
  }
  const validationResult = jobProfileSchema.safeParse(data);

  if (!validationResult.success) {
    return BadRequest(
      validationResult.error.issues.map((issue) => issue.message).join(", "),
    );
  }

  const profile = await jobProfileRepository.create(
    session.user.id,
    validationResult.data,
  );

  return Created(profile);
};

export { GET, POST };
