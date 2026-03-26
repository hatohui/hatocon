import { db } from "@/config/prisma";
import { UserDTO } from "@/types/user";

const userRepository = {
  getUserByEmail: async (email: string) => {
    const user = await db.user.findUnique({ where: { email } });
    return user;
  },
  createUser: async (data: UserDTO) => {
    const user = await db.user.create({ data });
    return user;
  },
  getUserById: async (id: string) => {
    const user = await db.user.findUnique({ where: { id } });
    return user;
  },
  updateUser: async (id: string, data: UserDTO) => {
    const user = await db.user.update({ where: { id }, data });
    return user;
  },
  deleteUser: async (id: string) => {
    await db.user.delete({ where: { id } });
  },
  getAllUsers: async () => {
    const users = await db.user.findMany();
    return users;
  },
};

export default userRepository;
