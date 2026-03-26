import { OK, Unauthorized } from "@/common/response";
import userRepository from "@/repositories/user_repository";
import { isAdminAsync } from "@/validations/isAdminAsync";

const GET = async () => {
  const isAuthorized = await isAdminAsync();

  if (!isAuthorized) {
    return Unauthorized();
  }

  const users = await userRepository.getAllUsers();

  return OK(users);
};

export { GET };
