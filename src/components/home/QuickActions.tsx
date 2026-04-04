"use client";

import {
  CalendarPlus,
  Plane,
  CalendarClock,
  Calendar,
  ClipboardList,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { getRandomQuote } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const QuickActionsCard = () => {
  const { data: session } = useSession();
  const [quote, setQuote] = useState("");

  const buttons = [
    {
      href: "/leave/new",
      icon: Plane,
      label: "Create A Plan",
    },
    {
      href: "/participations",
      icon: ClipboardList,
      label: "My Plans",
    },
    {
      href: "/schedule",
      icon: Calendar,
      label: "My Schedule",
    },
    {
      href: "/events/new",
      icon: CalendarPlus,
      label: "Create Event",
    },
    {
      href: "/events",
      icon: CalendarClock,
      label: "All Events",
    },
    {
      href: "/settings/profile",
      icon: Settings,
      label: "Settings",
    },
  ];

  useEffect(() => {
    setQuote(getRandomQuote());
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="lg:gap-8">
          {/* LEFT SIDE: Greeting + Quick Actions */}
          <div className="space-y-5 ">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                Hello, <span className="text-primary">{firstName}</span>!
              </h2>
              <div className="text-sm text-muted-foreground h-12">
                {quote ? (
                  quote
                ) : (
                  <div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
              {buttons.map((btn) => (
                <Button
                  key={btn.href}
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-4 gap-2 text-xs hover:bg-primary/5 transition-colors"
                  asChild
                >
                  <Link href={btn.href}>
                    <btn.icon className="h-5 w-5" />
                    <span>{btn.label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;
