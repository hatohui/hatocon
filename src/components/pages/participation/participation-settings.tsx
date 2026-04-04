"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";

import { useDeleteParticipation } from "@/hooks/participations/useParticipations";
import type { ParticipationDetail } from "@/types/participation.d";

export default function ParticipationSettings({
  participation,
  isOwner,
}: {
  participation: ParticipationDetail;
  isOwner: boolean;
}) {
  const router = useRouter();
  const deleteMutation = useDeleteParticipation();

  const handleDelete = () => {
    deleteMutation.mutate(participation.id, {
      onSuccess: () => {
        toast.success("Plan deleted");
        router.push("/participations");
      },
      onError: () => toast.error("Failed to delete plan"),
    });
  };

  return (
    <div className="space-y-6">
      {/* Participation Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Participation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created by</span>
            <span>{participation.createdBy ? "Admin" : "You"}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Leave type</span>
            <span>
              {participation.leaveType.charAt(0) +
                participation.leaveType.slice(1).toLowerCase()}
            </span>
          </div>
          {participation.event && (
            <>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Linked event</span>
                <span>{participation.event.title}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-sm text-destructive">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Delete this plan</p>
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone. Your leave record, activities,
                  and all associated photos will be permanently removed.
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Your leave record, all
                      activities, and any associated photos will be permanently
                      removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
