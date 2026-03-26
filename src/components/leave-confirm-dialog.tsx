"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConfirmProfile } from "@/hooks/job-profiles/useJobProfiles";
import type { JobProfile } from "@prisma/client";

export default function LeaveConfirmDialog({
  open,
  profile,
  onConfirmed,
}: {
  open: boolean;
  profile: JobProfile;
  onConfirmed: () => void;
}) {
  const confirm = useConfirmProfile();
  const router = useRouter();

  const handleConfirm = () => {
    confirm.mutate(undefined, { onSuccess: onConfirmed });
  };

  const handleUpdate = () => {
    onConfirmed();
    router.push("/settings/leave");
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Still the same leave policy?</DialogTitle>
          <DialogDescription>
            It&apos;s been over 3 months — please confirm your leave allowance
            is still accurate.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border p-4 space-y-1 text-sm">
          {profile.title && <p className="font-medium">{profile.title}</p>}
          <p>
            Paid leave:{" "}
            <span className="font-semibold">
              {profile.daysOfLeave} days/year
            </span>
          </p>
          <p>
            Sick leave:{" "}
            <span className="font-semibold">
              {profile.daysOfSickLeave} days/year
            </span>
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleUpdate}>
            Update my leave
          </Button>
          <Button onClick={handleConfirm} disabled={confirm.isPending}>
            {confirm.isPending ? "Confirming..." : "Yes, still the same"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
