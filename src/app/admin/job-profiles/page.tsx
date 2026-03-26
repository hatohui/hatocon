"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  useJobProfiles,
  useDeleteJobProfile,
} from "@/hooks/job-profiles/useJobProfiles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, UserPlus } from "lucide-react";

export default function AdminJobProfilesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data, isLoading } = useJobProfiles();
  const deleteProfile = useDeleteJobProfile();

  useEffect(() => {
    if (status === "authenticated" && !session?.user.isAdmin) {
      router.push("/");
    }
  }, [status, session, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session?.user.isAdmin) return null;

  const profiles = data ?? [];
  const hasProfile = profiles.some((p) => p.userId === session.user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Job Profiles</h1>
        <Button
          onClick={() => router.push("?modal=create")}
          disabled={hasProfile}
          title={hasProfile ? "You already have a job profile" : undefined}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Create Profile
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Days of Leave</TableHead>
              <TableHead>Sick Leave</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No job profiles found.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{profile.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {profile.title ? (
                      profile.title
                    ) : (
                      <Badge variant="secondary">No title</Badge>
                    )}
                  </TableCell>
                  <TableCell>{profile.daysOfLeave}</TableCell>
                  <TableCell>{profile.daysOfSickLeave}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(`?modal=edit&id=${profile.id}`)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={deleteProfile.isPending}
                        onClick={() => deleteProfile.mutate(profile.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
