"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useAddParticipationMember } from "@/hooks/participations/useParticipations";
import { useSearchUsers } from "@/hooks/users/useUsers";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function AddMemberPopover({
  participationId,
  existingUserIds,
}: {
  participationId: string;
  existingUserIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: users } = useSearchUsers(search);
  const addMember = useAddParticipationMember();

  const filteredUsers = users?.filter((u) => !existingUserIds.includes(u.id));

  const handleSelect = async (userId: string) => {
    try {
      await addMember.mutateAsync({ participationId, userId });
      toast.success("Member added!");
      setOpen(false);
      setSearch("");
    } catch {
      toast.error("Failed to add member");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" align="end">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search users..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search.length < 1 ? "Type to search..." : "No users found"}
            </CommandEmpty>
            {filteredUsers?.map((user) => (
              <CommandItem
                key={user.id}
                onSelect={() => handleSelect(user.id)}
                disabled={addMember.isPending}
              >
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={user.image ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
