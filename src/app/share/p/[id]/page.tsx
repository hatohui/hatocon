import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { format, differenceInCalendarDays } from "date-fns";
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react";

import participationRepository from "@/repositories/participation_repository";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

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
  const memberCount = data.group._count.participations;
  const days =
    differenceInCalendarDays(new Date(data.to), new Date(data.from)) + 1;

  const title = eventTitle ? `${groupName} - ${eventTitle}` : `${groupName}`;

  const descParts = [
    `${eventTitle ? `${eventTitle}` : `Travel plan by ${data.user.name}`}`,
    `📅 ${format(new Date(data.from), "MMM d")} – ${format(new Date(data.to), "MMM d, yyyy")} (${days} ${days === 1 ? "day" : "days"})`,
    data.event?.location && `📍 ${data.event.location}`,
    memberCount > 1 && `👥 ${memberCount} travellers`,
    LEAVE_LABELS[data.leaveType] && `🏷️ ${LEAVE_LABELS[data.leaveType]}`,
  ]
    .filter(Boolean)
    .join("\n");

  const images = data.event?.image
    ? [
        {
          url: data.event.image,
          width: 1200,
          height: 630,
          alt: eventTitle ?? groupName,
        },
      ]
    : [];

  return {
    title,
    description: descParts,
    openGraph: {
      type: "website",
      siteName: "Hatocon",
      title,
      description: descParts,
      images,
      locale: "en_US",
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      site: "@hatocon",
      title,
      description: descParts,
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
  const initials = data.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="min-h-screen bg-muted/40 flex flex-col items-center justify-center px-4 py-16 gap-4">
      {/* App wordmark */}
      <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
        hatocon
      </p>

      <div className="w-full max-w-sm overflow-hidden rounded-3xl border bg-card shadow-xl">
        {/* Hero */}
        <div className="relative w-full h-52 bg-muted">
          {data.event?.image ? (
            <Image
              src={data.event.image}
              alt={data.event.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

          {/* Leave badge */}
          <div className="absolute top-3 right-3">
            <Badge
              variant="secondary"
              className={`text-xs font-medium ${LEAVE_COLOURS[data.leaveType] ?? ""}`}
            >
              {LEAVE_LABELS[data.leaveType] ?? data.leaveType}
            </Badge>
          </div>

          {/* Event label on hero */}
          {data.event && (
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70 mb-0.5">
                Event
              </p>
              <p className="text-base font-bold leading-snug line-clamp-2">
                {data.event.title}
              </p>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Plan name + sharer */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight truncate">
                {groupName}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Travel Plan
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={data.user.image ?? undefined}
                  alt={data.user.name}
                />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium">{data.user.name}</p>
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-foreground font-medium">
                {format(new Date(data.from), "MMM d")} –{" "}
                {format(new Date(data.to), "MMM d, yyyy")}
              </span>
              <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">
                {days} {days === 1 ? "day" : "days"}
              </span>
            </div>

            {data.event?.location && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{data.event.location}</span>
              </div>
            )}

            {memberCount > 1 && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0 text-primary" />
                <span>{memberCount} travellers in this group</span>
              </div>
            )}
          </div>

          {data.event?.description && (
            <>
              <Separator />
              <p className="text-xs text-muted-foreground line-clamp-3">
                {data.event.description}
              </p>
            </>
          )}

          <Button asChild className="w-full gap-2">
            <Link href={`/participations/${id}`}>
              View Full Plan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
