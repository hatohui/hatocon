"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, UserCheck } from "lucide-react";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  useAddParticipationMember,
  useInviteMember,
} from "@/hooks/participations/useParticipations";
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
  canDirectAdd,
}: {
  participationId: string;
  existingUserIds: string[];
  /** Owner / Admin can directly add; members can only invite */
  canDirectAdd: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: users } = useSearchUsers(search);
  const addMember = useAddParticipationMember();
  const inviteMember = useInviteMember();

  const filteredUsers = users?.filter((u) => !existingUserIds.includes(u.id));
  const isPending = addMember.isPending || inviteMember.isPending;

  const handleAdd = async (userId: string) => {
    try {
      await addMember.mutateAsync({ participationId, userId });
      toast.success("Member added!");
      setOpen(false);
      setSearch("");
    } catch {
      toast.error("Failed to add member");
    }
  };

  const handleInvite = async (userId: string) => {
    try {
      await inviteMember.mutateAsync({ participationId, userId });
      toast.success("Invitation sent!");
      setOpen(false);
      setSearch("");
    } catch {
      toast.error("Failed to send invitation");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          {canDirectAdd ? "Add / Invite" : "Invite"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-72" align="end">
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
                onSelect={() => !canDirectAdd && handleInvite(user.id)}
                disabled={isPending}
                className="flex items-center gap-2 pr-1"
              >
                <Avatar className="h-6 w-6 mr-1 shrink-0">
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
                {canDirectAdd ? (
                  <div className="flex gap-1 shrink-0 ml-1">
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInvite(user.id);
                            }}
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send invite</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="default"
                            className="h-7 w-7"
                            disabled={isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdd(user.id);
                            }}
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add directly</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ) : null}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
