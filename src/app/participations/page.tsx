"use client";

import Link from "next/link";
import {
  format,
  differenceInCalendarDays,
  startOfYear,
  endOfYear,
} from "date-fns";
import { Calendar, Plane, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  useMyParticipations,
  useDeleteParticipation,
} from "@/hooks/participations/useParticipations";
import type { ParticipationWithEvent } from "@/types/participation.d";
import { toast } from "sonner";

const LEAVE_COLOURS: Record<string, string> = {
  ANNUAL: "bg-blue-100 text-blue-800",
  SICK: "bg-amber-100 text-amber-800",
  UNPAID: "bg-gray-100 text-gray-800",
};

// ─── Participation Card ──────────────────────────────────────────────────────

function ParticipationCard({
  p,
  onDelete,
  isDeleting,
}: {
  p: ParticipationWithEvent;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const days = differenceInCalendarDays(new Date(p.to), new Date(p.from)) + 1;

  return (
    <Link href={`/participations/${p.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Event title or stand-alone leave */}
              {p.event ? (
                <p className="font-medium line-clamp-1">{p.event.title}</p>
              ) : (
                <p className="font-medium text-muted-foreground">
                  Stand-alone leave
                </p>
              )}

              {/* Dates + duration */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(p.from), "MMM d")} –{" "}
                  {format(new Date(p.to), "MMM d, yyyy")}
                </span>
                <span>
                  {days} {days === 1 ? "day" : "days"}
                </span>
              </div>

              {/* Leave type badge */}
              <Badge
                variant="secondary"
                className={LEAVE_COLOURS[p.leaveType] ?? ""}
              >
                {p.leaveType.charAt(0) + p.leaveType.slice(1).toLowerCase()}
              </Badge>
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-1 shrink-0"
              onClick={(e) => e.preventDefault()}
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Your leave record and any
                      associated photos will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MyParticipationsPage() {
  const from = startOfYear(new Date());
  const to = endOfYear(new Date());
  const { data, isLoading } = useMyParticipations(from, to);
  const deleteMutation = useDeleteParticipation();

  const sorted = data
    ?.slice()
    .sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime());

  const upcoming = sorted?.filter((p) => new Date(p.to) >= new Date()) ?? [];
  const past = sorted?.filter((p) => new Date(p.to) < new Date()) ?? [];

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Plan deleted"),
      onError: () => toast.error("Failed to delete plan"),
    });
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Plans</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} leave plans &amp; trip photos
          </p>
        </div>
        <Button asChild>
          <Link href="/leave/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New Plan
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : !sorted?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Plane className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground mb-4">No plans yet this year</p>
            <Button asChild variant="outline">
              <Link href="/leave/new">Create your first plan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Upcoming</h2>
              {upcoming.map((p) => (
                <ParticipationCard
                  key={p.id}
                  p={p}
                  onDelete={() => handleDelete(p.id)}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-muted-foreground">
                Past
              </h2>
              {past.map((p) => (
                <ParticipationCard
                  key={p.id}
                  p={p}
                  onDelete={() => handleDelete(p.id)}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
