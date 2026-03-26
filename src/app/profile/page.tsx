"use client";

import { useSession } from "next-auth/react";
import { useMyJobProfile } from "@/hooks/job-profiles/useJobProfiles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data, isLoading } = useMyJobProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const profile = data;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>{session?.user.name}</CardTitle>
          <CardDescription>{session?.user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile && (
            <>
              {profile.title && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Job Title
                  </p>
                  <p>{profile.title}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Days of Leave
                  </p>
                  <p className="text-2xl font-bold">{profile.daysOfLeave}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Days of Sick Leave
                  </p>
                  <p className="text-2xl font-bold">
                    {profile.daysOfSickLeave}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
