import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

type MeResponse = {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string | null;
  hasPassword: boolean;
  isAdmin: boolean;
};

type ProfileUpdateDTO = {
  name?: string;
  username?: string;
  image?: string | null;
};

type PasswordChangeDTO = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const useMe = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: () =>
      axios.get<{ data: MeResponse }>("/api/me").then((r) => r.data.data),
  });

const useUpdateMe = () => {
  const queryClient = useQueryClient();
  const { update } = useSession();

  return useMutation({
    mutationFn: (data: ProfileUpdateDTO) =>
      axios.put<{ data: MeResponse }>("/api/me", data).then((r) => r.data.data),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["me"], updated);
      await update({ name: updated.name, image: updated.image });
    },
  });
};

const useChangePassword = () =>
  useMutation({
    mutationFn: (data: PasswordChangeDTO) =>
      axios.post("/api/me/password", data),
  });

const useUploadAvatar = () => {
  const updateMe = useUpdateMe();

  return useMutation({
    mutationFn: async (file: File) => {
      const { data } = await axios.post<{
        data: { uploadUrl: string; publicUrl: string };
      }>("/api/upload/avatar", {
        contentType: file.type,
        contentLength: file.size,
      });

      await fetch(data.data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      return updateMe.mutateAsync({ image: data.data.publicUrl });
    },
  });
};

export { useMe, useUpdateMe, useChangePassword, useUploadAvatar };
export type { MeResponse };
