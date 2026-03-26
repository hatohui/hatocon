import { auth } from "@/auth";
import { messages } from "@/common/messages";
import {
  BadRequest,
  NoContent,
  NotFound,
  OK,
  Unauthorized,
} from "@/common/response";
import jobProfileRepository from "@/repositories/job_profile_repository";
import { isAdminAsync } from "@/validations/isAdminAsync";
import { jobProfileSchema } from "@/validations/jobProfileSchema";
import type { NextRequest } from "next/server";

type Context = RouteContext<"/api/job-profiles/[id]">;

const GET = async (req: NextRequest, ctx: Context) => {
  const { id } = await ctx.params;

  const isAdmin = await isAdminAsync();
  const session = await auth();
  const profile = await jobProfileRepository.getById(id);

  if (!profile) {
    return NotFound(messages.jobProfile.notFound);
  }

  const isAuthorized = isAdmin || profile.userId === session?.user.id;

  if (!isAuthorized) {
    return Unauthorized();
  }

  return OK(profile);
};

const PUT = async (req: NextRequest, ctx: Context) => {
  const { id } = await ctx.params;

  const isAdmin = await isAdminAsync();
  const session = await auth();
  const profile = await jobProfileRepository.getById(id);

  if (!profile) {
    return NotFound(messages.jobProfile.notFound);
  }

  const isAuthorized = isAdmin || profile.userId === session?.user.id;

  if (!isAuthorized) {
    return Unauthorized();
  }

  const data = await req.json();
  if (data.leaveCycleStart && typeof data.leaveCycleStart === "string") {
    data.leaveCycleStart = new Date(data.leaveCycleStart);
  }
  const validationResult = jobProfileSchema.partial().safeParse(data);

  if (!validationResult.success) {
    return BadRequest(
      validationResult.error.issues.map((issue) => issue.message).join(", "),
    );
  }

  const updated = await jobProfileRepository.update(id, validationResult.data);

  return OK(updated);
};

const DELETE = async (req: NextRequest, ctx: Context) => {
  const { id } = await ctx.params;

  const isAdmin = await isAdminAsync();

  if (!isAdmin) {
    return Unauthorized();
  }

  const profile = await jobProfileRepository.getById(id);

  if (!profile) {
    return NotFound(messages.jobProfile.notFound);
  }

  await jobProfileRepository.delete(id);

  return NoContent();
};

export { GET, PUT, DELETE };
