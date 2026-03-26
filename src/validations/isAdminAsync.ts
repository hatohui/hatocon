import { auth } from "@/auth";

const isAdminAsync = async () => {
  const session = await auth();

  if (!session) {
    return false;
  }

  return session.user.isAdmin;
};

export { isAdminAsync };
