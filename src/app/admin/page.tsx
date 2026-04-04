"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  CalendarDays,
  CheckCircle,
  Clock,
  Plane,
  ImageIcon,
} from "lucide-react";

type ApiOk<T> = { data: T };
type Stats = {
  totalUsers: number;
  totalEvents: number;
  approvedEvents: number;
  pendingEvents: number;
  totalParticipations: number;
  totalImages: number;
};

const STAT_CARDS = [
  {
    key: "totalUsers" as const,
    label: "Total Users",
    icon: Users,
    color: "text-blue-500",
  },
  {
    key: "totalEvents" as const,
    label: "Total Events",
    icon: CalendarDays,
    color: "text-purple-500",
  },
  {
    key: "approvedEvents" as const,
    label: "Approved Events",
    icon: CheckCircle,
    color: "text-green-500",
  },
  {
    key: "pendingEvents" as const,
    label: "Pending Approval",
    icon: Clock,
    color: "text-amber-500",
  },
  {
    key: "totalParticipations" as const,
    label: "Participations",
    icon: Plane,
    color: "text-sky-500",
  },
  {
    key: "totalImages" as const,
    label: "Trip Images",
    icon: ImageIcon,
    color: "text-pink-500",
  },
];

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session && !session.user.isAdmin) router.replace("/");
  }, [session, router]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () =>
      axios.get<ApiOk<Stats>>("/api/admin/stats").then((r) => r.data.data),
  });

  if (!session?.user?.isAdmin) return null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of your platform.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{stats?.[key] ?? "—"}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
