"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  useMyJobProfile,
  THREE_MONTHS_MS,
} from "@/hooks/job-profiles/useJobProfiles";
import ProfileSetupDialog from "@/components/profile-setup-dialog";
import LeaveConfirmDialog from "@/components/leave-confirm-dialog";

export default function ProfileGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const { data, isLoading, isError, refetch } = useMyJobProfile();
  const [confirmed, setConfirmed] = useState(false);

  if (status !== "authenticated") {
    return <>{children}</>;
  }

  if (isLoading) {
    return <>{children}</>;
  }

  const hasProfile = !isError && !!data;

  const needsConfirmation =
    hasProfile &&
    !confirmed &&
    Date.now() - new Date(data.updatedAt).getTime() > THREE_MONTHS_MS;

  return (
    <>
      <ProfileSetupDialog open={!hasProfile} onComplete={() => refetch()} />
      {hasProfile && (
        <LeaveConfirmDialog
          open={needsConfirmation}
          profile={data}
          onConfirmed={() => setConfirmed(true)}
        />
      )}
      {children}
    </>
  );
}
