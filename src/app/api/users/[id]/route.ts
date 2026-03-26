import { auth } from "@/auth";
import { OK, Unauthorized } from "@/common/response";
import userRepository from "@/repositories/user_repository";
import { isAdminAsync } from "@/validations/isAdminAsync";
import type { NextRequest } from "next/server";

type Context = RouteContext<"/api/users/[id]">;

const POST = async (req: NextRequest, ctx: Context) => {
  const { id } = await ctx.params;

  return OK({ id });
};

const GET = async (req: NextRequest, ctx: Context) => {
  const { id } = await ctx.params;

  const isAdmin = await isAdminAsync();
  const session = await auth();
  const isAuthorized = isAdmin || id === session?.user.id;

  if (!isAuthorized) {
    return Unauthorized();
  }

  const user = await userRepository.getUserById(id);

  return OK(user);
};

export { POST, GET };
