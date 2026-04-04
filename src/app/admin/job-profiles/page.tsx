"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Trash2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { JobProfileWithUser } from "@/types/job-profile";

type ApiOk<T> = { data: T };

const COUNTRY_LABELS: Record<string, string> = { VN: "🇻🇳 VN", SG: "🇸🇬 SG" };
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PAGE_SIZE = 20;

export default function AdminJobProfilesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (session && !session.user.isAdmin) router.replace("/");
  }, [session, router]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["job-profiles", "admin"],
    queryFn: () =>
      axios
        .get<ApiOk<JobProfileWithUser[]>>("/api/job-profiles")
        .then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/job-profiles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-profiles", "admin"] });
      toast.success("Job profile deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.user.name?.toLowerCase().includes(q) ||
        p.user.email.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q)
    );
  }, [profiles, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!session?.user?.isAdmin) return null;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job Profiles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Leave entitlements for all users.
          </p>
        </div>
        {!isLoading && (
          <Badge variant="secondary" className="text-sm">
            {filtered.length} profiles
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search name, email, title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="text-center">Annual</TableHead>
              <TableHead className="text-center">Sick</TableHead>
              <TableHead>Cycle Start</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : paged.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                      No job profiles found.
                    </TableCell>
                  </TableRow>
                )
              : paged.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={profile.user.image ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {profile.user.name?.[0] ?? profile.user.email[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">{profile.user.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{profile.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{profile.title ?? "—"}</TableCell>
                    <TableCell className="text-center text-sm">
                      {profile.daysOfLeave} d
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {profile.daysOfSickLeave} d
                    </TableCell>
                    <TableCell className="text-sm">
                      {profile.leaveCycleStart != null
                        ? `${MONTH_NAMES[(profile.leaveCycleStart - 1) % 12]}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {COUNTRY_LABELS[profile.user.country ?? ""] ?? (profile.user.country ?? "—")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(profile.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            router.push(`?modal=edit&id=${profile.id}`)
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteId(profile.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} ({filtered.length} total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this job profile. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
