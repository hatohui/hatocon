import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { JobProfileWithUser } from "@/types/job-profile";

const UserAvatar = ({ profile }: { profile: JobProfileWithUser }) => {
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage
        src={profile.user.image ?? undefined}
        alt={profile.user.name}
      />
      <AvatarFallback className="text-xs">
        {profile.user.name
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
