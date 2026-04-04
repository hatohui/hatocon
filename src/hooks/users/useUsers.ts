import { userService } from "@/services/user_service";
import { useQuery } from "@tanstack/react-query";

const useUsers = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: userService.getAll,
    retry: 1,
    staleTime: Infinity,
  });

const useSearchUsers = (query: string) =>
  useQuery({
    queryKey: ["users", "search", query],
    queryFn: () => userService.search(query),
    enabled: query.length >= 1,
  });

export { useUsers, useSearchUsers };
