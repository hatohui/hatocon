"use client";

import { useSession } from "next-auth/react";
import { useMyJobProfile } from "@/hooks/job-profiles/useJobProfiles";
import ProfileSetupDialog from "@/components/profile-setup-dialog";

export default function ProfileGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const { data, isLoading, isError, refetch } = useMyJobProfile();

  if (status !== "authenticated") {
    return <>{children}</>;
  }

  if (isLoading) {
    return <>{children}</>;
  }

  const hasProfile = !isError && !!data;

  return (
    <>
      <ProfileSetupDialog open={!hasProfile} onComplete={() => refetch()} />
      {children}
    </>
  );
}
