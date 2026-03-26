"use client";

import * as React from "react";
import { CalendarPlus, ClipboardList, Zap, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaveBalance } from "@/hooks/participations/useParticipations";
import LogLeaveDialog from "./LogLeaveDialog";

function BalanceBar({
  label,
  used,
  total,
  colorClass,
}: {
  label: string;
  used: number;
  total: number;
  colorClass: string;
}) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const remaining = Math.max(total - used, 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {remaining.toFixed(1)}
          <span className="text-muted-foreground font-normal">
            /{total} days left
          </span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function QuickActions() {
  const [showLogLeave, setShowLogLeave] = React.useState(false);
  const { data: balance, isLoading } = useLeaveBalance();

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-3 gap-1.5 text-xs"
            onClick={() => setShowLogLeave(true)}
          >
            <ClipboardList className="h-4 w-4" />
            Log Leave
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-3 gap-1.5 text-xs"
            asChild
          >
            <Link href="/events/new">
              <CalendarPlus className="h-4 w-4" />
              Create Event
            </Link>
          </Button>
        </div>

        <Separator className="my-4" />

        <div className="space-y-1 mb-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Leave Balance
            </p>
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 px-1" asChild>
              <Link href="/settings/leave">
                Adjust
                <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : !balance ? (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Set up your job profile to track leave balance.
            </p>
            <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" asChild>
              <Link href="/settings/leave">Set up now</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <BalanceBar
              label="Annual Leave"
              used={balance.annual.used}
              total={balance.annual.total}
              colorClass="bg-emerald-500"
            />
            <BalanceBar
              label="Sick Leave"
              used={balance.sick.used}
              total={balance.sick.total}
              colorClass="bg-blue-500"
            />
          </div>
        )}
      </div>

      <LogLeaveDialog open={showLogLeave} onOpenChange={setShowLogLeave} />
    </>
  );
}
