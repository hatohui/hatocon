"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRightLeft } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useTransferOwnership } from "@/hooks/participations/useParticipationGroup";
import type { ParticipationParticipant } from "@/types/participation.d";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function TransferOwnershipDialog({
  participationId,
  participants,
  currentOwnerId,
}: {
  participationId: string;
  participants: ParticipationParticipant[];
  currentOwnerId: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const transfer = useTransferOwnership();

  const eligible = participants.filter((p) => p.userId !== currentOwnerId);

  const handleTransfer = () => {
    if (!selected) return;
    transfer.mutate(
      { participationId, userId: selected },
      {
        onSuccess: () => {
          toast.success("Ownership transferred");
          setOpen(false);
          setSelected(null);
        },
        onError: () => toast.error("Failed to transfer ownership"),
      },
    );
  };

  if (eligible.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ArrowRightLeft className="h-4 w-4" />
          Transfer Ownership
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Ownership</DialogTitle>
          <DialogDescription>
            Select a member to transfer ownership to. You will become a regular
            member after the transfer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-64 overflow-y-auto py-2">
          {eligible.map((p) => (
            <button
              key={p.userId}
              type="button"
              onClick={() => setSelected(p.userId)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                selected === p.userId
                  ? "bg-primary/10 ring-1 ring-primary"
                  : "hover:bg-accent"
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={p.user.image ?? undefined} />
                <AvatarFallback className="text-xs">
                  {initials(p.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-medium truncate">{p.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {p.user.email}
                </p>
              </div>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selected || transfer.isPending}
          >
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
