import { userService } from "@/services/user_service";
import { useQuery } from "@tanstack/react-query";

const useUsers = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: userService.getAll,
    retry: 1,
  });

export { useUsers };
