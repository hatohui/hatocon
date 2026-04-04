"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  useWorkSchedule,
  useUpdateWorkSchedule,
  useScheduleExceptions,
  useCreateScheduleException,
  useDeleteScheduleException,
} from "@/hooks/schedule/useSchedule";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = [
  { key: "monday" as const, label: "Mon" },
  { key: "tuesday" as const, label: "Tue" },
  { key: "wednesday" as const, label: "Wed" },
  { key: "thursday" as const, label: "Thu" },
  { key: "friday" as const, label: "Fri" },
  { key: "saturday" as const, label: "Sat" },
  { key: "sunday" as const, label: "Sun" },
];

export default function SettingsSchedulePage() {
  const { data: schedule, isLoading } = useWorkSchedule();
  const updateSchedule = useUpdateWorkSchedule();
  const { data: exceptions } = useScheduleExceptions();
  const createException = useCreateScheduleException();
  const deleteException = useDeleteScheduleException();

  const [exDate, setExDate] = useState<Date>();
  const [exIsWork, setExIsWork] = useState(false);
  const [exReason, setExReason] = useState("");

  if (isLoading) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleDayToggle = (day: (typeof DAYS)[number]["key"]) => {
    if (!schedule) return;
    updateSchedule.mutate({ ...schedule, [day]: !schedule[day] });
  };

  const handleAddException = () => {
    if (!exDate) return;
    createException.mutate(
      {
        date: exDate.toISOString(),
        isWorkDay: exIsWork,
        reason: exReason || undefined,
      },
      {
        onSuccess: () => {
          setExDate(undefined);
          setExIsWork(false);
          setExReason("");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Work Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Work Schedule</CardTitle>
          <CardDescription>
            Select which days of the week are your regular work days. This
            affects your leave balance calculation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map(({ key, label }) => {
              const active = schedule?.[key] ?? false;
              return (
                <button
                  key={key}
                  onClick={() => handleDayToggle(key)}
                  disabled={updateSchedule.isPending}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {label}
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      active ? "bg-primary" : "bg-muted",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Exceptions */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Exceptions</CardTitle>
          <CardDescription>
            Override specific dates as work days or off days (e.g., a Saturday
            shift or a weekday off).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add exception form */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-45 justify-start text-left font-normal",
                      !exDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {exDate ? format(exDate, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={exDate}
                    onSelect={setExDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <div className="flex items-center gap-2 h-9">
                <Switch checked={exIsWork} onCheckedChange={setExIsWork} />
                <span className="text-sm">
                  {exIsWork ? "Work day" : "Off day"}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-30 space-y-1.5">
              <Label className="text-xs">Reason (optional)</Label>
              <Input
                value={exReason}
                onChange={(e) => setExReason(e.target.value)}
                placeholder="e.g. Saturday overtime"
                className="h-9"
              />
            </div>
            <Button
              size="sm"
              onClick={handleAddException}
              disabled={!exDate || createException.isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Exception list */}
          {exceptions && exceptions.length > 0 && (
            <div className="space-y-2">
              {exceptions.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        ex.isWorkDay ? "bg-green-500" : "bg-red-500",
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(ex.date), "MMM d, yyyy")}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({ex.isWorkDay ? "Work day" : "Off day"})
                        </span>
                      </p>
                      {ex.reason && (
                        <p className="text-xs text-muted-foreground">
                          {ex.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteException.mutate(ex.id)}
                    disabled={deleteException.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {exceptions && exceptions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No schedule exceptions yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
