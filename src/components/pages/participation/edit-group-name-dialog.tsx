"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUpdateGroupSettings } from "@/hooks/participations/useParticipationGroup";

type Props = {
  participationId: string;
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function EditGroupNameDialog({
  participationId,
  currentName,
  open,
  onOpenChange,
}: Props) {
  const [name, setName] = useState(currentName);
  const updateSettings = useUpdateGroupSettings();

  const handleSave = () => {
    if (!name.trim()) return;
    updateSettings.mutate(
      { participationId, data: { name: name.trim() } },
      {
        onSuccess: () => {
          toast.success("Name updated");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to update name"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Plan name"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!name.trim() || updateSettings.isPending}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
