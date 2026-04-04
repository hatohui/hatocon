"use client";

import { addYears, format } from "date-fns";
import { Wand2, Link, ChevronRight, CalendarClock } from "lucide-react";
import {} from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { useLeaveBalance } from "@/hooks/participations/useParticipations";
import BalanceBar from "../common/BalanceBar";

const LeaveBalance = () => {
  const { data: balance, isLoading } = useLeaveBalance();

  return (
    <div className="space-y-4 mx-2">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Leave Balance</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1 px-1"
            asChild
          >
            <Link href="/settings/leave">
              Adjust
              <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        {isLoading ? (
          <Skeleton className="h-4 w-40" />
        ) : balance?.cycleFrom ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3 shrink-0" />
            <span>
              Cycle: {format(new Date(balance.cycleFrom), "MMM d")} –{" "}
              {format(addYears(new Date(balance.cycleFrom), 1), "MMM d, yyyy")}
            </span>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))}
        </div>
      ) : !balance ? (
        <div className="rounded-lg border border-dashed p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Set up your job profile to track leave balance.
          </p>
          <Button
            variant="link"
            size="sm"
            className="mt-1 h-auto p-0 text-xs"
            asChild
          >
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
  );
};

export default LeaveBalance;
