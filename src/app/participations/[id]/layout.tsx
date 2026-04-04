import type { Metadata } from "next";
import type { ReactNode } from "react";
import { format } from "date-fns";

import participationRepository from "@/repositories/participation_repository";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const data = await participationRepository.getShareData(id);

  if (!data) {
    return { title: "Plan not found | Hatocon" };
  }

  const groupName = data.group?.name ?? "My Plan";
  const eventTitle = data.event?.title;
  const title = eventTitle
    ? `${groupName} — ${eventTitle} | Hatocon`
    : `${groupName} | Hatocon`;

  const description = [
    `${data.user.name}'s travel plan`,
    data.event?.location && `📍 ${data.event.location}`,
    `${format(new Date(data.from), "MMM d")} – ${format(new Date(data.to), "MMM d, yyyy")}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title,
    description,
  };
}

export default function ParticipationLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
