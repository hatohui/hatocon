"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { Event, User } from "@prisma/client";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Plane,
  RefreshCw,
  Search,
  UserPlus,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCreateParticipation } from "@/hooks/participations/useParticipations";
import { useAllEvents, useEventById } from "@/hooks/events/useEvents";
import { useSearchUsers } from "@/hooks/users/useUsers";
import { LeaveType } from "@/types/leave-type";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

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
          <div className="relative aspect-3/1 w-full">
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
                      <div className="relative aspect-4/1 w-full">
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-start gap-3 px-4 py-3">
                      <div className="shrink-0 text-center bg-primary/10 rounded-lg px-2 py-1 min-w-10">
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

// ─── Date Picker Field ───────────────────────────────────────────────────────

function DatePickerField({
  label,
  value,
  onChange,
  fromDate,
  required,
}: {
  label: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  fromDate?: Date;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            fromDate={fromDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─── Co-Traveler Picker ──────────────────────────────────────────────────────

function CoTravelerPicker({
  selected,
  onChange,
}: {
  selected: Omit<User, "password">[];
  onChange: (users: Omit<User, "password">[]) => void;
}) {
  const { data: session } = useSession();
  const [searchQ, setSearchQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQ), 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const { data: results, isLoading } = useSearchUsers(debouncedQ);

  const filtered = React.useMemo(() => {
    if (!results) return [];
    return results.filter(
      (u) => u.id !== session?.user?.id && !selected.some((s) => s.id === u.id),
    );
  }, [results, session, selected]);

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((u) => (
            <Badge key={u.id} variant="secondary" className="gap-1.5 pr-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src={u.image ?? undefined} />
                <AvatarFallback className="text-[8px]">
                  {u.name?.[0]}
                </AvatarFallback>
              </Avatar>
              {u.name}
              <button
                type="button"
                className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                onClick={() => onChange(selected.filter((s) => s.id !== u.id))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search people to add…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
      </div>
      {searchQ && debouncedQ && (
        <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No users found
            </p>
          ) : (
            filtered.slice(0, 10).map((u) => (
              <button
                key={u.id}
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                onClick={() => {
                  onChange([...selected, u]);
                  setSearchQ("");
                }}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={u.image ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {u.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.email}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function CreatePlanPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId");
  const { mutateAsync: createParticipation, isPending } =
    useCreateParticipation();

  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [planName, setPlanName] = React.useState("");
  const [from, setFrom] = React.useState<Date | undefined>();
  const [to, setTo] = React.useState<Date | undefined>();
  const [leaveType, setLeaveType] = React.useState<string>(LeaveType.ANNUAL);
  const [coTravelers, setCoTravelers] = React.useState<
    Omit<User, "password">[]
  >([]);
  const [entryFlight, setEntryFlight] = React.useState("");
  const [exitFlight, setExitFlight] = React.useState("");

  // Restore draft from sessionStorage on mount
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("hatocon:leave/new:draft");
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.planName) setPlanName(draft.planName);
      if (draft.from) setFrom(new Date(draft.from));
      if (draft.to) setTo(new Date(draft.to));
      if (draft.leaveType) setLeaveType(draft.leaveType);
      if (Array.isArray(draft.coTravelers)) setCoTravelers(draft.coTravelers);
      if (draft.entryFlight) setEntryFlight(draft.entryFlight);
      if (draft.exitFlight) setExitFlight(draft.exitFlight);
      // Only restore selected event if no eventId in the URL
      if (!eventIdParam && draft.selectedEvent)
        setSelectedEvent(draft.selectedEvent);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save draft to sessionStorage on any state change
  React.useEffect(() => {
    try {
      sessionStorage.setItem(
        "hatocon:leave/new:draft",
        JSON.stringify({
          planName,
          from: from?.toISOString(),
          to: to?.toISOString(),
          leaveType,
          coTravelers,
          entryFlight,
          exitFlight,
          selectedEvent,
        }),
      );
    } catch {}
  }, [
    planName,
    from,
    to,
    leaveType,
    coTravelers,
    entryFlight,
    exitFlight,
    selectedEvent,
  ]);

  // Pre-populate from query param
  const { data: prefillEvent } = useEventById(eventIdParam);
  React.useEffect(() => {
    if (prefillEvent && !selectedEvent) {
      setSelectedEvent(prefillEvent as Event);
      setFrom(new Date(prefillEvent.startAt));
      setTo(new Date(prefillEvent.endAt));
    }
  }, [prefillEvent, selectedEvent]);

  // Auto-fill dates when an event is selected
  const handleEventSelect = (event: Event | null) => {
    setSelectedEvent(event);
    if (event) {
      setFrom(new Date(event.startAt));
      setTo(new Date(event.endAt));
    } else {
      // Remove eventId from URL so the prefill effect doesn't re-trigger
      router.replace("/leave/new", { scroll: false });
    }
  };

  const canSubmit =
    !!planName.trim() && from && to && leaveType && to >= from && !isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      await createParticipation({
        eventId: selectedEvent?.id,
        planName: planName.trim(),
        from,
        to,
        leaveType: leaveType as (typeof LeaveType)[keyof typeof LeaveType],
        coTravelerIds: coTravelers.map((u) => u.id),
        entryFlight: entryFlight.trim() || undefined,
        exitFlight: exitFlight.trim() || undefined,
      });
      sessionStorage.removeItem("hatocon:leave/new:draft");
      toast.success("Plan created successfully!");
      router.push("/");
    } catch (err: unknown) {
      type AxErr = {
        response?: {
          data?: {
            message?: string;
            data?: { conflictFrom?: string; conflictTo?: string };
          };
        };
      };
      const axErr = err as AxErr;
      const msg = axErr?.response?.data?.message;

      if (msg === "PARTICIPATION_OVERLAP") {
        const conflict = axErr?.response?.data?.data;
        if (conflict?.conflictFrom && conflict?.conflictTo) {
          const cf = format(new Date(conflict.conflictFrom), "MMM d, yyyy");
          const ct = format(new Date(conflict.conflictTo), "MMM d, yyyy");
          toast.error(
            `Period conflict: you already have a plan from ${cf} to ${ct}.`,
          );
        } else {
          toast.error(
            "You already have a plan that overlaps with these dates.",
          );
        }
      } else if (msg === "PARTICIPATION_EVENT_NO_OVERLAP") {
        toast.error(
          "Your selected dates don't overlap with the event by more than 1 hour. Please adjust your dates to include some part of the event.",
        );
      } else {
        toast.error(msg ?? "Failed to create plan. Please try again.");
      }
    }
  };

  const duration =
    from && to && to >= from
      ? Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : null;

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

      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Plane className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Create A Plan</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Plan your travel. Optionally link to an event and add co-travelers.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Link to an Event</CardTitle>
            <CardDescription>
              Optional — attach this plan to an existing event. Dates will
              auto-fill.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventPicker value={selectedEvent} onChange={handleEventSelect} />
          </CardContent>
        </Card>

        {/* Travel details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Travel Dates</CardTitle>
            <CardDescription>
              Pick your travel dates. Leave will be logged as annual leave.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Plan name */}
            <div className="space-y-1.5">
              <Label htmlFor="plan-name">
                Plan Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="plan-name"
                placeholder="e.g. Tokyo Trip 2026"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DatePickerField
                label="From"
                value={from}
                onChange={setFrom}
                fromDate={new Date()}
                required
              />
              <DatePickerField
                label="To"
                value={to}
                onChange={setTo}
                fromDate={from ?? new Date()}
                required
              />
            </div>

            {/* Flight numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Plane className="h-3.5 w-3.5" />
                  Arrival flight
                </Label>
                <Input
                  placeholder="e.g. TGW517"
                  value={entryFlight}
                  onChange={(e) => setEntryFlight(e.target.value.toUpperCase())}
                  maxLength={20}
                  className="uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Plane className="h-3.5 w-3.5 rotate-180" />
                  Departure flight
                </Label>
                <Input
                  placeholder="e.g. TGW518"
                  value={exitFlight}
                  onChange={(e) => setExitFlight(e.target.value.toUpperCase())}
                  maxLength={20}
                  className="uppercase"
                />
              </div>
            </div>

            {from && to && to < from && (
              <p className="text-sm text-destructive">
                End date must be on or after the start date.
              </p>
            )}

            {duration && (
              <p className="text-sm text-muted-foreground">
                Duration:{" "}
                <span className="font-medium text-foreground">
                  {duration} {duration === 1 ? "day" : "days"}
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Co-travelers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Co-Travelers</CardTitle>
            <CardDescription>
              Optional — invite others to join this plan. They will also have
              leave logged for the same dates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CoTravelerPicker
              selected={coTravelers}
              onChange={setCoTravelers}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {isPending ? "Creating…" : "Create Plan"}
          </Button>
        </div>
      </form>
    </main>
  );
}

export default function CreatePlanPage() {
  return (
    <Suspense>
      <CreatePlanPageInner />
    </Suspense>
  );
}
