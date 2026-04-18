"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUpdateParticipationDates } from "@/hooks/participations/useParticipations";

type Props = {
  participationId: string;
  defaultFrom: Date | string;
  defaultTo: Date | string;
  defaultEntryFlight?: string | null;
  defaultExitFlight?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function EditOwnDatesDialog({
  participationId,
  defaultFrom,
  defaultTo,
  defaultEntryFlight,
  defaultExitFlight,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [fromVal, setFromVal] = useState(
    format(new Date(defaultFrom), "yyyy-MM-dd'T'HH:mm"),
  );
  const [toVal, setToVal] = useState(
    format(new Date(defaultTo), "yyyy-MM-dd'T'HH:mm"),
  );
  const [entryFlight, setEntryFlight] = useState(defaultEntryFlight ?? "");
  const [exitFlight, setExitFlight] = useState(defaultExitFlight ?? "");
  const updateDates = useUpdateParticipationDates();

  const handleSave = () => {
    if (!fromVal || !toVal) return;
    updateDates.mutate(
      {
        id: participationId,
        data: {
          from: new Date(fromVal).toISOString(),
          to: new Date(toVal).toISOString(),
          entryFlight: entryFlight.trim() || null,
          exitFlight: exitFlight.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Your dates updated");
          onOpenChange(false);
          onSuccess?.();
        },
        onError: () => toast.error("Failed to update dates"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit your arrival &amp; departure</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Set your personal arrival and departure times within the group plan.
        </p>
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Your arrival</label>
            <Input
              type="datetime-local"
              value={fromVal}
              onChange={(e) => setFromVal(e.target.value)}
            />
            <Input
              placeholder="Arrival flight (e.g. TGW517)"
              value={entryFlight}
              onChange={(e) => setEntryFlight(e.target.value.toUpperCase())}
              className="uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Your departure</label>
            <Input
              type="datetime-local"
              value={toVal}
              onChange={(e) => setToVal(e.target.value)}
            />
            <Input
              placeholder="Departure flight (e.g. TGW518)"
              value={exitFlight}
              onChange={(e) => setExitFlight(e.target.value.toUpperCase())}
              className="uppercase"
            />
          </div>
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
              disabled={!fromVal || !toVal || updateDates.isPending}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
