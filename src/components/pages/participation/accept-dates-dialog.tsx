"use client";

import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromInput: string;
  toInput: string;
  entryFlight: string;
  exitFlight: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onEntryFlightChange: (v: string) => void;
  onExitFlightChange: (v: string) => void;
  onAccept: () => void;
  isPending: boolean;
  eventDateRange?: { from: Date | string; to: Date | string } | null;
};

export default function AcceptDatesDialog({
  open,
  onOpenChange,
  fromInput,
  toInput,
  entryFlight,
  exitFlight,
  onFromChange,
  onToChange,
  onEntryFlightChange,
  onExitFlightChange,
  onAccept,
  isPending,
  eventDateRange,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Set your arrival &amp; departure</DialogTitle>
        </DialogHeader>
        {eventDateRange && (
          <p className="text-sm text-muted-foreground -mt-2">
            Group plan: {format(new Date(eventDateRange.from), "MMM d")} &ndash;{" "}
            {format(new Date(eventDateRange.to), "MMM d, yyyy")}
          </p>
        )}
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Your arrival</label>
            <Input
              type="datetime-local"
              value={fromInput}
              onChange={(e) => onFromChange(e.target.value)}
            />
            <Input
              placeholder="Arrival flight (e.g. TGW517)"
              value={entryFlight}
              onChange={(e) =>
                onEntryFlightChange(e.target.value.toUpperCase())
              }
              className="uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Your departure</label>
            <Input
              type="datetime-local"
              value={toInput}
              onChange={(e) => onToChange(e.target.value)}
            />
            <Input
              placeholder="Departure flight (e.g. TGW518)"
              value={exitFlight}
              onChange={(e) => onExitFlightChange(e.target.value.toUpperCase())}
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
              onClick={onAccept}
              disabled={!fromInput || !toInput || isPending}
            >
              Join
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
