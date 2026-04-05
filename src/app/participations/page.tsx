"use client";

import Link from "next/link";
import { startOfYear, endOfYear } from "date-fns";
import { Plane, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMyParticipations,
  useDeleteParticipation,
} from "@/hooks/participations/useParticipations";
import { toast } from "sonner";
import ParticipationCard from "@/components/pages/participation/participation-card";

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
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
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
            <section className="flex flex-col gap-3">
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
