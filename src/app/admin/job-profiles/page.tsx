"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Trash2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { JobProfileWithUser } from "@/types/job-profile";

type ApiOk<T> = { data: T };

const COUNTRY_LABELS: Record<string, string> = { VN: "🇻🇳 VN", SG: "🇸🇬 SG" };
const PAGE_SIZE = 20;

function InlineTextCell({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder?: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const start = () => {
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className="h-7 w-full min-w-24 px-1.5 text-sm"
        autoFocus
      />
    );
  }

  return (
    <span
      className="block cursor-pointer rounded px-1 py-0.5 hover:bg-muted/60 transition-colors text-sm"
      onClick={start}
      title="Click to edit"
    >
      {value || (
        <span className="text-muted-foreground italic">
          {placeholder ?? "—"}
        </span>
      )}
    </span>
  );
}

function InlineNumberCell({
  value,
  onSave,
}: {
  value: number;
  onSave: (val: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const start = () => {
    setDraft(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    setEditing(false);
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n !== value) onSave(n);
  };

  const cancel = () => {
    setDraft(String(value));
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        min={0}
        max={365}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className="h-7 w-16 px-1.5 text-sm text-center"
        autoFocus
      />
    );
  }

  return (
    <span
      className="block cursor-pointer rounded px-1 py-0.5 hover:bg-muted/60 transition-colors text-sm text-center"
      onClick={start}
      title="Click to edit"
    >
      {value} d
    </span>
  );
}

export default function AdminJobProfilesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      axios.put(`/api/job-profiles/${id}`, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-profiles", "admin"] });
      toast.success("Profile updated");
    },
    onError: () => toast.error("Failed to update"),
  });

  const handleUpdate = (id: string, data: Record<string, unknown>) =>
    updateMutation.mutate({ id, data });

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
        p.title?.toLowerCase().includes(q),
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
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-10 text-muted-foreground text-sm"
                >
                  No job profiles found.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((profile) => (
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
                        <p className="text-sm font-medium leading-none">
                          {profile.user.name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-32">
                    <InlineTextCell
                      value={profile.title ?? ""}
                      placeholder="No title"
                      onSave={(v) => handleUpdate(profile.id, { title: v })}
                    />
                  </TableCell>
                  <TableCell className="text-center min-w-16">
                    <InlineNumberCell
                      value={profile.daysOfLeave}
                      onSave={(v) =>
                        handleUpdate(profile.id, { daysOfLeave: v })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center min-w-16">
                    <InlineNumberCell
                      value={profile.daysOfSickLeave}
                      onSave={(v) =>
                        handleUpdate(profile.id, { daysOfSickLeave: v })
                      }
                    />
                  </TableCell>
                  <TableCell className="min-w-28">
                    <Input
                      type="date"
                      className="h-7 text-xs w-32 px-1.5"
                      value={
                        profile.leaveCycleStart != null
                          ? new Date(profile.leaveCycleStart)
                              .toISOString()
                              .slice(0, 10)
                          : ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        handleUpdate(profile.id, {
                          leaveCycleStart: v
                            ? new Date(v + "T00:00:00.000Z").toISOString()
                            : null,
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {COUNTRY_LABELS[profile.user.country ?? ""] ??
                        profile.user.country ??
                        "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(profile.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(profile.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
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
