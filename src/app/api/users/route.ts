import { auth } from "@/auth";
import { BadRequest, OK, Unauthorized } from "@/common/response";
import userRepository from "@/repositories/user_repository";
import { isAdminAsync } from "@/validations/isAdminAsync";
import type { NextRequest } from "next/server";

const GET = async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const search = req.nextUrl.searchParams.get("search");

  // If search param is provided, any authenticated user can search
  if (search !== null) {
    if (search.length < 1) return BadRequest("Search query is required");
    const users = await userRepository.searchUsers(search);
    return OK(users);
  }

  // Without search param, only admins can list all users
  const isAdmin = await isAdminAsync();
  if (!isAdmin) return Unauthorized();

  const users = await userRepository.getAllUsers();
  return OK(users);
};

export { GET };
