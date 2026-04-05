"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { initials, type MemberUser } from "./activity-timeline.types";

export function UserPopover({
  userId,
  allUsers,
}: {
  userId: string;
  allUsers: MemberUser[];
}) {
  const user = allUsers.find((u) => u.id === userId);
  if (!user) return <Badge variant="secondary">Unknown</Badge>;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium hover:bg-secondary/80 transition-colors"
        >
          <Avatar className="h-4 w-4">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="text-[8px]">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          {user.name}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
