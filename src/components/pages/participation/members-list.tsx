"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Crown, UserMinus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useKickMember } from "@/hooks/participations/useParticipationGroup";
import type { ParticipationParticipant } from "@/types/participation.d";
import type { ParticipationGroupDTO } from "@/types/notification.d";
import AddMemberPopover from "./add-member-popover";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function MembersList({
  participants,
  participationId,
  group,
  currentUserId,
  isAdmin,
}: {
  participants: ParticipationParticipant[];
  participationId: string;
  group: ParticipationGroupDTO | null;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const kickMember = useKickMember();
  const existingUserIds = participants.map((p) => p.userId);
  const isOwner = group?.ownerId === currentUserId;
  const canKick = isOwner || isAdmin;
  const canInvite =
    isOwner || isAdmin || (group?.isMemberInviteAllowed ?? true);

  const handleKick = (userId: string, name: string) => {
    kickMember.mutate(
      { participationId, userId },
      {
        onSuccess: () => toast.success(`${name} has been removed`),
        onError: () => toast.error("Failed to remove member"),
      },
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            Members ({participants.length})
          </CardTitle>
          {canInvite && (
            <AddMemberPopover
              participationId={participationId}
              existingUserIds={existingUserIds}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={p.user.image ?? undefined} />
              <AvatarFallback className="text-xs">
                {initials(p.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium truncate">{p.user.name}</p>
                {p.userId === group?.ownerId && (
                  <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {p.user.email}
              </p>
            </div>
            {canKick && p.userId !== group?.ownerId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove {p.user.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove their participation from this event. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleKick(p.userId, p.user.name)}
                      disabled={kickMember.isPending}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
