"use client";

import { useState } from "react";
import { format, startOfYear, endOfYear } from "date-fns";
import {
  useCustomHolidays,
  useCreateCustomHoliday,
  useDeleteCustomHoliday,
  useHolidays,
} from "@/hooks/schedule/useSchedule";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsHolidaysPage() {
  const now = new Date();
  const from = startOfYear(now).toISOString();
  const to = endOfYear(now).toISOString();

  const { data: customHolidays, isLoading: loadingCustom } =
    useCustomHolidays();
  const { data: publicHolidays, isLoading: loadingPublic } = useHolidays(
    from,
    to,
  );
  const createHoliday = useCreateCustomHoliday();
  const deleteHoliday = useDeleteCustomHoliday();

  const [newDate, setNewDate] = useState<Date>();
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (!newDate || !newName.trim()) return;
    createHoliday.mutate(
      { date: newDate.toISOString(), name: newName.trim() },
      {
        onSuccess: () => {
          setNewDate(undefined);
          setNewName("");
        },
      },
    );
  };

  if (loadingCustom || loadingPublic) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Separate public holidays by country for display
  const countryLabel =
    publicHolidays?.[0]?.country === "SG" ? "Singapore" : "Vietnam";

  return (
    <div className="space-y-6">
      {/* Custom Holidays */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Holidays</CardTitle>
          <CardDescription>
            Add your own personal holidays. Leave taken on these days won&apos;t
            count against your balance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-45 justify-start text-left font-normal",
                      !newDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDate ? format(newDate, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 min-w-40 space-y-1.5">
              <Label className="text-xs">Holiday Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Company Anniversary"
                className="h-9"
              />
            </div>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newDate || !newName.trim() || createHoliday.isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {customHolidays && customHolidays.length > 0 ? (
            <div className="space-y-2">
              {customHolidays.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{h.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(h.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteHoliday.mutate(h.id)}
                    disabled={deleteHoliday.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No custom holidays added yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Public Holidays (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Public Holidays ({now.getFullYear()})</CardTitle>
          <CardDescription>
            These dates are automatically excluded from your leave balance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {publicHolidays && publicHolidays.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                {countryLabel}
                <Badge variant="secondary" className="text-[10px]">
                  {publicHolidays.length}
                </Badge>
              </h3>
              <div className="space-y-1">
                {publicHolidays.map((h) => (
                  <div
                    key={h.date}
                    className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm"
                  >
                    <span>{h.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(h.date + "T00:00:00"), "MMM d, yyyy")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No public holidays found for this year.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
