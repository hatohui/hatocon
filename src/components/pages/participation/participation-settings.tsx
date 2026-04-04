"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { useUpdateGroupSettings } from "@/hooks/participations/useParticipationGroup";
import type { ParticipationDetail } from "@/types/participation.d";
import TransferOwnershipDialog from "./transfer-ownership-dialog";

export default function ParticipationSettings({
  participation,
  isOwner,
}: {
  participation: ParticipationDetail;
  isOwner: boolean;
}) {
  const router = useRouter();
  const deleteMutation = useDeleteParticipation();
  const updateSettings = useUpdateGroupSettings();

  const group = participation.group;
  const isGroupOwner = group?.ownerId === participation.userId && isOwner;

  const handleDelete = () => {
    deleteMutation.mutate(participation.id, {
      onSuccess: () => {
        toast.success("Plan deleted");
        router.push("/participations");
      },
      onError: () => toast.error("Failed to delete plan"),
    });
  };

  const handleToggle = (key: string, value: boolean) => {
    updateSettings.mutate(
      { participationId: participation.id, data: { [key]: value } },
      { onError: () => toast.error("Failed to update setting") },
    );
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

      {/* Group Settings (owner only, event-linked only) */}
      {isGroupOwner && group && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Group Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingToggle
              id="isMemberInviteAllowed"
              label="Allow member invites"
              description="When enabled, any member can invite others to join"
              checked={group.isMemberInviteAllowed}
              onToggle={(v) => handleToggle("isMemberInviteAllowed", v)}
              disabled={updateSettings.isPending}
            />
            <Separator />
            <SettingToggle
              id="isPublic"
              label="Public participation"
              description="Anyone with the link can view this participation"
              checked={group.isPublic}
              onToggle={(v) => handleToggle("isPublic", v)}
              disabled={updateSettings.isPending}
            />
            <Separator />
            <SettingToggle
              id="isActivityPublicVisible"
              label="Public activity visibility"
              description="Non-members can see activities. If disabled, returns 404"
              checked={group.isActivityPublicVisible}
              onToggle={(v) => handleToggle("isActivityPublicVisible", v)}
              disabled={updateSettings.isPending}
            />
            <Separator />
            <SettingToggle
              id="isMemberListPublicVisible"
              label="Public member list"
              description="Non-members can see the member list"
              checked={group.isMemberListPublicVisible}
              onToggle={(v) => handleToggle("isMemberListPublicVisible", v)}
              disabled={updateSettings.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Transfer Ownership (owner only, event-linked only) */}
      {isGroupOwner && group && participation.participants.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ownership</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Transfer ownership</p>
                <p className="text-xs text-muted-foreground">
                  Transfer ownership to another member. You will become a
                  regular member.
                </p>
              </div>
              <TransferOwnershipDialog
                participationId={participation.id}
                participants={participation.participants}
                currentOwnerId={group.ownerId}
              />
            </div>
          </CardContent>
        </Card>
      )}

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

function SettingToggle({
  id,
  label,
  description,
  checked,
  onToggle,
  disabled,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onToggle: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
    </div>
  );
}
