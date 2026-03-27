import { db } from "@/config/prisma";
import { UserDTO } from "@/types/user";

const userRepository = {
  getUserByEmail: async (email: string) => {
    const user = await db.user.findUnique({
      where: { email },
      omit: { password: true },
    });
    return user;
  },
  createUser: async (data: UserDTO) => {
    const user = await db.user.create({ data });
    return user;
  },
  getUserById: async (id: string) => {
    const user = await db.user.findUnique({
      where: { id },
      omit: { password: true },
    });
    return user;
  },
  updateUser: async (id: string, data: Partial<UserDTO>) => {
    const user = await db.user.update({ where: { id }, data });
    return user;
  },
  deleteUser: async (id: string) => {
    await db.user.delete({ where: { id } });
  },
  getAllUsers: async () => {
    const users = await db.user.findMany({ omit: { password: true } });
    return users;
  },
  getAllUsersAdmin: async () => {
    const users = await db.user.findMany();
    return users;
  },
  searchUsers: async (query: string, limit = 20) => {
    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { id: { equals: query } },
        ],
      },
      omit: { password: true },
      take: limit,
    });
    return users;
  },
};

export default userRepository;
