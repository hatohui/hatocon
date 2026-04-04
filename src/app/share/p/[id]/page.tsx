import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { format, differenceInCalendarDays } from "date-fns";
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react";

import participationRepository from "@/repositories/participation_repository";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PageProps = { params: Promise<{ id: string }> };

const LEAVE_LABELS: Record<string, string> = {
  ANNUAL: "Annual Leave",
  SICK: "Sick Leave",
  UNPAID: "Unpaid Leave",
};

const LEAVE_COLOURS: Record<string, string> = {
  ANNUAL: "bg-blue-100 text-blue-800",
  SICK: "bg-amber-100 text-amber-800",
  UNPAID: "bg-gray-100 text-gray-800",
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await participationRepository.getShareData(id);

  if (!data || !data.group?.isPublic) {
    return { title: "Not Found" };
  }

  const groupName = data.group.name;
  const eventTitle = data.event?.title;
  const title = eventTitle ? `${groupName} — ${eventTitle}` : groupName;
  const description = [
    data.user.name + "'s travel plan",
    data.event?.location && `📍 ${data.event.location}`,
    `${format(new Date(data.from), "MMM d")} – ${format(new Date(data.to), "MMM d, yyyy")}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const images = data.event?.image ? [{ url: data.event.image }] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "website",
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function SharePage({ params }: PageProps) {
  const { id } = await params;
  const data = await participationRepository.getShareData(id);

  if (!data || !data.group?.isPublic) {
    notFound();
  }

  const groupName = data.group.name;
  const memberCount = data.group._count.participations;
  const days =
    differenceInCalendarDays(new Date(data.to), new Date(data.from)) + 1;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg space-y-6">
        {/* Event banner image */}
        {data.event?.image && (
          <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-md">
            <Image
              src={data.event.image}
              alt={data.event.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 text-white">
              <p className="text-xs font-medium opacity-80 uppercase tracking-wider">
                Event
              </p>
              <p className="text-lg font-bold leading-tight">
                {data.event.title}
              </p>
            </div>
          </div>
        )}

        {/* Plan details card */}
        <div className="rounded-2xl border bg-card shadow-sm p-6 space-y-5">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Travel Plan
            </p>
            <h1 className="text-2xl font-bold">{groupName}</h1>
            <p className="text-sm text-muted-foreground">
              Shared by{" "}
              <span className="font-medium text-foreground">
                {data.user.name}
              </span>
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                {format(new Date(data.from), "MMM d")} –{" "}
                {format(new Date(data.to), "MMM d, yyyy")}
              </span>
              <span className="text-xs">
                ({days} {days === 1 ? "day" : "days"})
              </span>
            </div>

            {data.event?.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{data.event.location}</span>
              </div>
            )}

            {memberCount > 1 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <span>{memberCount} travellers</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className={LEAVE_COLOURS[data.leaveType] ?? ""}
            >
              {LEAVE_LABELS[data.leaveType] ?? data.leaveType}
            </Badge>
          </div>

          {data.event?.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 border-t pt-4">
              {data.event.description}
            </p>
          )}

          <Button asChild className="w-full gap-2 mt-2">
            <Link href={`/participations/${id}`}>
              View Full Plan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Powered by Hatocon
        </p>
      </div>
    </main>
  );
}
