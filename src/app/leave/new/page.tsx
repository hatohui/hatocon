"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, isWeekend, parseISO } from "date-fns";
import type { Event } from "@prisma/client";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateParticipation } from "@/hooks/participations/useParticipations";
import { useAllEvents } from "@/hooks/events/useEvents";
import { LeaveType } from "@/types/leave-type";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ─── Event Picker ─────────────────────────────────────────────────────────────

function EventPicker({
  value,
  onChange,
}: {
  value: Event | null;
  onChange: (event: Event | null) => void;
}) {
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data: results, isLoading } = useAllEvents({
    q: debouncedQ || undefined,
    limit: 8,
  });

  const showResults = debouncedQ.length >= 1 && !value;

  if (value) {
    const start = new Date(value.startAt);
    const end = new Date(value.endAt);
    return (
      <div className="rounded-xl border bg-primary/5 border-primary/20 overflow-hidden">
        {value.image && (
          <div className="relative aspect-[3/1] w-full">
            <Image
              src={value.image}
              alt={value.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{value.title}</p>
                  {value.isYearly && (
                    <Badge
                      variant="outline"
                      className="text-[9px] h-4 px-1 shrink-0"
                    >
                      <RefreshCw className="h-2.5 w-2.5 mr-0.5" />
                      Yearly
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(start, "MMM d")} – {format(end, "MMM d, yyyy")}
                </p>
                {value.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {value.location}
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full shrink-0"
              onClick={() => onChange(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search events by name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {showResults && (
        <div className="border rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : !results || results.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              No events match your search
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y">
              {results.map((event) => {
                const start = new Date(event.startAt);
                const end = new Date(event.endAt);
                const days = Math.ceil(
                  (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
                );
                return (
                  <button
                    key={event.id}
                    type="button"
                    className="w-full text-left hover:bg-muted/60 transition-colors"
                    onClick={() => {
                      onChange(event);
                      setQ("");
                    }}
                  >
                    {event.image && (
                      <div className="relative aspect-[4/1] w-full">
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-start gap-3 px-4 py-3">
                      <div className="shrink-0 text-center bg-primary/10 rounded-lg px-2 py-1 min-w-[40px]">
                        <p className="text-[9px] font-bold text-primary uppercase">
                          {format(start, "MMM")}
                        </p>
                        <p className="text-base font-bold text-primary leading-none">
                          {format(start, "d")}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {event.title}
                          </p>
                          {event.isYearly && (
                            <Badge
                              variant="outline"
                              className="text-[9px] h-4 px-1 shrink-0"
                            >
                              <RefreshCw className="h-2.5 w-2.5 mr-0.5" />
                              Yearly
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(start, "MMM d")} – {format(end, "MMM d")}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1"
                          >
                            {days === 1 ? "1 day" : `${days} days`}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Date input with weekend warning ─────────────────────────────────────────

function DateField({
  id,
  label,
  value,
  onChange,
  min,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  required?: boolean;
}) {
  const isWknd = value && isWeekend(parseISO(value));
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="date"
        value={value}
        min={min}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          isWknd && "border-orange-400 focus-visible:ring-orange-400",
        )}
      />
      {isWknd && (
        <p className="text-xs text-orange-500">
          Heads up — this falls on a weekend. Leave is typically taken on
          weekdays.
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogLeavePage() {
  const router = useRouter();
  const { mutateAsync: createParticipation, isPending } =
    useCreateParticipation();

  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [leaveType, setLeaveType] = React.useState<string>("");

  // Auto-fill dates when an event is selected
  const handleEventSelect = (event: Event | null) => {
    setSelectedEvent(event);
    if (event) {
      setFrom(format(new Date(event.startAt), "yyyy-MM-dd"));
      setTo(format(new Date(event.endAt), "yyyy-MM-dd"));
    }
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const canSubmit =
    from && to && leaveType && new Date(to) >= new Date(from) && !isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      await createParticipation({
        eventId: selectedEvent?.id,
        from: new Date(from),
        to: new Date(to),
        leaveType: leaveType as (typeof LeaveType)[keyof typeof LeaveType],
      });
      toast.success("Leave logged successfully!");
      router.push("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to log leave. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Log Leave</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Record your leave. Optionally link it to a company event.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Link to an Event</CardTitle>
            <CardDescription>
              Optional — attach this leave to an existing company event. Dates
              will auto-fill.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventPicker value={selectedEvent} onChange={handleEventSelect} />
          </CardContent>
        </Card>

        {/* Leave details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Leave Details</CardTitle>
            <CardDescription>
              Set the leave type and date range.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Leave type */}
            <div className="space-y-1.5">
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType} required>
                <SelectTrigger id="leaveType" className="w-full">
                  <SelectValue placeholder="Select leave type…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LeaveType.ANNUAL}>Annual Leave</SelectItem>
                  <SelectItem value={LeaveType.SICK}>Sick Leave</SelectItem>
                  <SelectItem value={LeaveType.UNPAID}>Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <DateField
                id="from"
                label="From"
                value={from}
                onChange={setFrom}
                min={todayStr}
                required
              />
              <DateField
                id="to"
                label="To"
                value={to}
                onChange={(v) => {
                  setTo(v);
                }}
                min={from || todayStr}
                required
              />
            </div>

            {from && to && new Date(to) < new Date(from) && (
              <p className="text-sm text-destructive">
                End date must be on or after the start date.
              </p>
            )}

            {from && to && new Date(to) >= new Date(from) && (
              <p className="text-sm text-muted-foreground">
                Duration:{" "}
                <span className="font-medium text-foreground">
                  {Math.ceil(
                    (new Date(to).getTime() - new Date(from).getTime()) /
                      (1000 * 60 * 60 * 24),
                  ) + 1}{" "}
                  days
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {isPending ? "Logging…" : "Log Leave"}
          </Button>
        </div>
      </form>
    </main>
  );
}
