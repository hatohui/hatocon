"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { Search, Trash2, CalendarDays, Users, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ApiOk<T> = { data: T };

type Participation = {
  id: string;
  userId: string;
  eventId: string | null;
  from: string;
  to: string;
  leaveType: string;
  createdBy: string | null;
  createdAt: string;
  user: { id: string; name: string; image: string | null; email: string };
  event: { id: string; title: string; startAt: string; endAt: string } | null;
};

type Stats = {
  totalUsers: number;
  totalEvents: number;
  approvedEvents: number;
  pendingEvents: number;
  totalParticipations: number;
  totalImages: number;
};

export default function AdminParticipationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (session && !session.user.isAdmin) router.replace("/");
  }, [session, router]);

  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () =>
      axios.get<ApiOk<Stats>>("/api/admin/stats").then((r) => r.data.data),
  });

  const { data: participations, isLoading } = useQuery({
    queryKey: ["admin", "participations"],
    queryFn: () =>
      axios
        .get<ApiOk<Participation[]>>("/api/admin/participations")
        .then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/admin/participations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "participations"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Participation deleted");
      setDeleteId(null);
    },
  });

  const filtered = participations?.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.user.name?.toLowerCase().includes(q) ||
      p.user.email?.toLowerCase().includes(q) ||
      p.event?.title?.toLowerCase().includes(q) ||
      p.leaveType.toLowerCase().includes(q)
    );
  });

  const leaveColor = (type: string) => {
    switch (type) {
      case "ANNUAL":
        return "bg-blue-100 text-blue-800";
      case "SICK":
        return "bg-red-100 text-red-800";
      case "UNPAID":
        return "bg-gray-100 text-gray-800";
      default:
        return "";
    }
  };

  if (!session?.user?.isAdmin) return null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Participations</h1>
        <p className="text-sm text-muted-foreground">
          Manage all travel plans and leave entries
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalUsers ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Total Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.totalParticipations ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats ? `${stats.approvedEvents}/${stats.totalEvents}` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">approved / total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Travel Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalImages ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by user, event, or type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 rounded-md" />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered && filtered.length > 0 ? (
                filtered.map((p) => {
                  const days = Math.ceil(
                    (new Date(p.to).getTime() - new Date(p.from).getTime()) /
                      (1000 * 60 * 60 * 24),
                  );
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={p.user.image ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {p.user.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{p.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.event ? (
                          <span className="text-sm">{p.event.title}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={leaveColor(p.leaveType)}
                        >
                          {p.leaveType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(p.from), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(p.to), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {days}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.createdBy ? "Co-traveler" : "Self"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No participations found
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Participation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this leave entry. This action cannot
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
