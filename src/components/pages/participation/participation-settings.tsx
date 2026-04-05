"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Trash2 } from "lucide-react";

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

import {
  useDeleteGroup,
  useLeaveGroup,
  useUpdateGroupSettings,
} from "@/hooks/participations/useParticipationGroup";
import type { ParticipationDetail } from "@/types/participation.d";
import TransferOwnershipDialog from "./transfer-ownership-dialog";

export default function ParticipationSettings({
  participation,
  isOwner,
  myParticipationId,
}: {
  participation: ParticipationDetail;
  isOwner: boolean;
  myParticipationId?: string;
}) {
  const router = useRouter();
  const deleteGroupMutation = useDeleteGroup();
  const leaveGroupMutation = useLeaveGroup();
  const updateSettings = useUpdateGroupSettings();

  const group = participation.group;
  const isGroupOwner = group?.ownerId === participation.userId && isOwner;
  // The participation ID to act on — owner uses their own record; members use theirs
  const actionParticipationId = myParticipationId ?? participation.id;
  // Show Danger Zone to the plan owner or any group member with their own record
  const showDangerZone = isOwner || !!myParticipationId;

  const handleDeleteGroup = () => {
    deleteGroupMutation.mutate(participation.id, {
      onSuccess: () => {
        toast.success("Group deleted");
        router.push("/participations");
      },
      onError: () => toast.error("Failed to delete group"),
    });
  };

  const handleLeaveGroup = () => {
    leaveGroupMutation.mutate(actionParticipationId, {
      onSuccess: () => {
        toast.success("You have left the group");
        router.push("/participations");
      },
      onError: () => toast.error("Failed to leave group"),
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
            <Separator />
            <SettingToggle
              id="isMediaPublicVisible"
              label="Public media visibility"
              description="Non-members can view the photos and media gallery"
              checked={group.isMediaPublicVisible}
              onToggle={(v) => handleToggle("isMediaPublicVisible", v)}
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
      {showDangerZone && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-sm text-destructive">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Leave Plan — shown for everyone */}
            <DangerRow
              title="Leave Plan"
              description={
                isGroupOwner
                  ? "Leave this plan. Ownership will be transferred to the next member, or the plan will be disbanded if you are the only member."
                  : "Remove yourself from this plan. Your activities and photos will be permanently deleted."
              }
              dialogTitle="Leave this plan?"
              dialogDescription={
                isGroupOwner
                  ? "Your activities and data will be removed. If another member exists, they will become the new owner. Otherwise the plan will be disbanded."
                  : "This cannot be undone. Your activities and photos in this plan will be permanently removed."
              }
              buttonLabel="Leave Plan"
              icon={<LogOut className="h-4 w-4 mr-1.5" />}
              isPending={leaveGroupMutation.isPending}
              onConfirm={handleLeaveGroup}
            />

            {/* Delete Plan — group owner only, wipes the entire plan for everyone */}
            {isGroupOwner && (
              <>
                <Separator />
                <DangerRow
                  title="Delete Plan"
                  description="Permanently removes the plan and all members' data. Everyone in the group will lose their plans."
                  dialogTitle="Delete the entire plan?"
                  dialogDescription="This cannot be undone. All members' plans, activities, and photos will be permanently deleted and they will be notified."
                  buttonLabel="Delete Plan"
                  isPending={deleteGroupMutation.isPending}
                  onConfirm={handleDeleteGroup}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DangerRow({
  title,
  description,
  dialogTitle,
  dialogDescription,
  buttonLabel,
  icon,
  isPending,
  onConfirm,
}: {
  title: string;
  description: string;
  dialogTitle: string;
  dialogDescription: string;
  buttonLabel: string;
  icon?: React.ReactNode;
  isPending: boolean;
  onConfirm: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={isPending}>
            {icon ?? <Trash2 className="h-4 w-4 mr-1.5" />}
            {buttonLabel}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {buttonLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
