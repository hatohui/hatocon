"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, Fragment } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Search,
  ChevronDown,
  ChevronRight,
  Users,
  ImageIcon,
  Layers,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ApiOk<T> = { data: T };

type ParticipantInGroup = {
  id: string;
  userId: string;
  from: string;
  to: string;
  leaveType: string;
  createdBy: string | null;
  createdAt: string;
  user: { id: string; name: string; image: string | null; email: string };
};

type AdminGroup = {
  id: string;
  name: string;
  ownerId: string;
  eventId: string | null;
  isPublic: boolean;
  createdAt: string;
  event: { id: string; title: string; startAt: string; endAt: string } | null;
  participations: ParticipantInGroup[];
  _count: { images: number; activities: number };
};

type GroupsResponse = {
  total: number;
  page: number;
  pageSize: number;
  groups: AdminGroup[];
};

const LEAVE_COLOUR: Record<string, string> = {
  ANNUAL: "bg-blue-100 text-blue-800",
  SICK: "bg-red-100 text-red-800",
  UNPAID: "bg-gray-100 text-gray-800",
};

const PAGE_SIZE = 20;

export default function AdminParticipationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<
    "group" | "participation" | null
  >(null);

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

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "groups", debouncedSearch, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      return axios
        .get<ApiOk<GroupsResponse>>(`/api/admin/groups?${params}`)
        .then((r) => r.data.data);
    },
  });

  const deleteParticipation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/admin/participations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "groups"] });
      toast.success("Participation removed");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;
  const groups = data?.groups ?? [];

  if (!session?.user?.isAdmin) return null;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Participations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All participation groups. Click a row to see members.
          </p>
        </div>
        {data && (
          <Badge variant="secondary" className="text-sm">
            {data.total} groups
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search group, event, member…"
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
              <TableHead className="w-8" />
              <TableHead>Group</TableHead>
              <TableHead>Event</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead className="text-center">Images</TableHead>
              <TableHead className="text-center">Activities</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Created</TableHead>
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
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-10 text-muted-foreground text-sm"
                >
                  No groups found.
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => {
                const expanded = expandedIds.has(group.id);
                return (
                  <Fragment key={group.id}>
                    {/* Group row */}
                    <TableRow
                      key={group.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpand(group.id)}
                    >
                      <TableCell className="text-muted-foreground">
                        {expanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{group.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {group.event ? (
                          <span>{group.event.title}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="flex items-center justify-center gap-1 text-sm">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {group.participations.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="flex items-center justify-center gap-1 text-sm">
                          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          {group._count.images}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {group._count.activities}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={group.isPublic ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {group.isPublic ? "Public" : "Private"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(group.createdAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>

                    {/* Expanded participant rows */}
                    {expanded &&
                      group.participations.map((p) => (
                        <TableRow
                          key={p.id}
                          className="bg-muted/30 hover:bg-muted/40"
                        >
                          <TableCell colSpan={8} className="py-0">
                            <div className="flex items-center gap-4 pl-10 py-2.5 border-b last:border-0">
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarImage src={p.user.image ?? undefined} />
                                <AvatarFallback className="text-xs">
                                  {p.user.name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-36">
                                <p className="text-sm font-medium leading-tight">
                                  {p.user.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {p.user.email}
                                </p>
                              </div>
                              <Badge
                                variant="secondary"
                                className={`text-xs shrink-0 ${LEAVE_COLOUR[p.leaveType] ?? ""}`}
                              >
                                {p.leaveType}
                              </Badge>
                              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                {format(new Date(p.from), "MMM d")} –{" "}
                                {format(new Date(p.to), "MMM d, yyyy")}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {p.createdBy ? "Added by admin" : "Self"}
                              </span>
                              <div className="ml-auto">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(p.id);
                                    setDeleteType("participation");
                                  }}
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {expanded && group.participations.length === 0 && (
                      <TableRow className="bg-muted/30">
                        <TableCell
                          colSpan={8}
                          className="text-center text-xs text-muted-foreground py-3 pl-10"
                        >
                          No participants in this group.
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} ({data?.total} total)
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
            <AlertDialogTitle>Remove participation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this member from the group. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId && deleteType === "participation") {
                  deleteParticipation.mutate(deleteId);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
