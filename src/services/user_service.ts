import { UserDTO } from "@/types/user";
import { User } from "@prisma/client";
import axios from "axios";

type ApiOk<T> = { data: T };

const userService = {
  getAll: () => axios.get<ApiOk<Omit<User, "password">[]>>("/api/users"),
  search: (query: string) =>
    axios
      .get<ApiOk<Omit<User, "password">[]>>(`/api/users?search=${encodeURIComponent(query)}`)
      .then((r) => r.data.data),
  getById: (id: string) =>
    axios.get<Omit<User, "password">>(`/api/users/${id}`),
  create: (user: UserDTO) =>
    axios.post<Omit<User, "password">>("/api/users", user),
  update: (id: string, user: Omit<UserDTO, "password">) =>
    axios.put<Omit<User, "password">>(`/api/users/${id}`, user),
  delete: (id: string) =>
    axios.delete<Omit<User, "password">>(`/api/users/${id}`),
};

export { userService };
