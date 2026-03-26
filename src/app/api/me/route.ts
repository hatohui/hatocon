import { auth } from "@/auth";
import { OK } from "@/common/response";
import userRepository from "@/repositories/user_repository";

const GET = async () => {
  const session = await auth();
  const user = await userRepository.getUserById(session?.user.id || "");

  return OK(user);
};

export { GET };
