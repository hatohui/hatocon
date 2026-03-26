import { auth } from "@/auth";
import { messages } from "@/common/messages";
import { BadRequest, OK, Unauthorized } from "@/common/response";
import userRepository from "@/repositories/user_repository";
import { isAdminAsync } from "@/validations/isAdminAsync";
import { userSchema } from "@/validations/userSchema";
import type { NextRequest } from "next/server";

type Context = RouteContext<"/api/users/[id]">;

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

const PUT = async (req: NextRequest, ctx: Context) => {
  const { id } = await ctx.params;

  const isAdmin = await isAdminAsync();
  const session = await auth();
  const isAuthorized = isAdmin || id === session?.user.id;

  if (!isAuthorized) {
    return Unauthorized();
  }

  const data = await req.json();

  if (data.password) {
    return BadRequest(messages.auth.passwordChangeNotSupported);
  }

  const validationResult = userSchema.partial().safeParse(data);

  if (!validationResult.success) {
    return BadRequest(
      validationResult.error.issues.map((issue) => issue.message).join(", "),
    );
  }

  const updatedUser = await userRepository.updateUser(id, data);

  return OK(updatedUser);
};

export { GET, PUT };
