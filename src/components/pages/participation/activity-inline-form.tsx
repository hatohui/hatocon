"use client";

import { useEffect, useRef, useState } from "react";
import { addMinutes, differenceInMinutes, format } from "date-fns";
import {
  CalendarIcon,
  Check,
  Clock,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import {
  useCreateActivity,
  useUpdateActivity,
  useSearchParticipationMembers,
} from "@/hooks/activities/useActivities";
import { ActivityWithMedia } from "@/types/activity.d";

type UserLike = { id: string; name: string; image: string | null };

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/** 30-minute interval options for the time selects */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
    .toString()
    .padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function buildDatetime(date: Date | undefined, time: string): Date | null {
  if (!date || !time) return null;
  const [h, m] = time.split(":").map(Number);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    h,
    m,
    0,
    0,
  );
}

function parseInit(dt: Date | string | undefined): {
  date: Date | undefined;
  time: string;
} {
  if (!dt) return { date: undefined, time: "" };
  const d = new Date(dt);
  return { date: d, time: format(d, "HH:mm") };
}

// --------------------------------------------------------------------------
// Date picker field
// --------------------------------------------------------------------------

function DatePickerField({
  id,
  label,
  date,
  fromDate,
  onChange,
  required,
}: {
  id: string;
  label: string;
  date: Date | undefined;
  fromDate?: Date;
  onChange: (d: Date | undefined) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 h-8 font-normal text-sm"
          >
            <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {date ? (
              format(date, "EEE, MMM d, yyyy")
            ) : (
              <span className="text-muted-foreground">Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              onChange(d);
              setOpen(false);
            }}
            disabled={fromDate ? { before: fromDate } : undefined}
            defaultMonth={date ?? fromDate}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// --------------------------------------------------------------------------
// Time picker field
// --------------------------------------------------------------------------

function TimePickerField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} size="sm" className="w-full h-8 text-sm">
          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Time" />
        </SelectTrigger>
        <SelectContent className="max-h-52">
          {TIME_OPTIONS.map((t) => (
            <SelectItem key={t} value={t} className="text-sm">
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// --------------------------------------------------------------------------
// Main form
// --------------------------------------------------------------------------

export default function ActivityInlineForm({
  participationId,
  activity,
  allUsers,
  onDone,
}: {
  participationId: string;
  activity?: ActivityWithMedia;
  allUsers?: UserLike[];
  onDone: () => void;
}) {
  const isEditing = !!activity;
  const createMutation = useCreateActivity();
  const updateMutation = useUpdateActivity();

  const [name, setName] = useState(activity?.name ?? "");
  const [location, setLocation] = useState(activity?.location ?? "");
  const [note, setNote] = useState(activity?.note ?? "");
  const [imageUrl, setImageUrl] = useState(activity?.imageUrl ?? "");

  const initFrom = parseInit(activity?.from);
  const initTo = parseInit(activity?.to);
  const [fromDate, setFromDate] = useState<Date | undefined>(initFrom.date);
  const [fromTime, setFromTime] = useState(initFrom.time || "09:00");
  const [toDate, setToDate] = useState<Date | undefined>(initTo.date);
  const [toTime, setToTime] = useState(initTo.time || "10:00");

  const [peopleOpen, setPeopleOpen] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<UserLike[]>(() => {
    if (!activity?.involvedPeople.length) return [];
    return activity.involvedPeople.map((id) => {
      const found = allUsers?.find((u) => u.id === id);
      return found
        ? { id, name: found.name, image: found.image }
        : { id, name: id, image: null };
    });
  });

  const { data: searchResults } = useSearchParticipationMembers(
    participationId,
    peopleSearch,
  );
  const filteredPeople = (searchResults ?? []).filter(
    (u) => !selectedPeople.some((p) => p.id === u.id),
  );

  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Derived
  const fromDatetime = buildDatetime(fromDate, fromTime);
  const toDatetime = buildDatetime(toDate, toTime);
  const durationMinutes =
    fromDatetime && toDatetime
      ? differenceInMinutes(toDatetime, fromDatetime)
      : null;
  const durationText =
    durationMinutes !== null && durationMinutes > 0
      ? formatDuration(durationMinutes)
      : null;
  const durationNegative = durationMinutes !== null && durationMinutes < 0;

  // Handlers
  const handleFromDateChange = (date: Date | undefined) => {
    setFromDate(date);
    if (date && toDate && date > toDate) setToDate(date);
  };

  const handleFromTimeChange = (time: string) => {
    setFromTime(time);
    const newFrom = buildDatetime(fromDate, time);
    const currentTo = buildDatetime(toDate, toTime);
    if (newFrom && currentTo && currentTo <= newFrom) {
      const advanced = addMinutes(newFrom, 60);
      setToDate(
        new Date(
          advanced.getFullYear(),
          advanced.getMonth(),
          advanced.getDate(),
        ),
      );
      // snap to nearest 30m
      const mins = advanced.getMinutes();
      const snappedMin = mins < 15 ? "00" : mins < 45 ? "30" : "00";
      const snappedHour =
        mins >= 45
          ? String(advanced.getHours() + 1).padStart(2, "0")
          : String(advanced.getHours()).padStart(2, "0");
      setToTime(`${snappedHour}:${snappedMin}`);
    }
  };

  const addPerson = (user: UserLike) => {
    if (selectedPeople.some((p) => p.id === user.id)) return;
    setSelectedPeople((prev) => [...prev, user]);
    setPeopleSearch("");
    setPeopleOpen(false);
  };

  const removePerson = (id: string) => {
    setSelectedPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Activity name is required");
      nameRef.current?.focus();
      return;
    }
    if (!fromDatetime) {
      toast.error("Start date and time are required");
      return;
    }

    const payload = {
      name: name.trim(),
      from: fromDatetime.toISOString(),
      to: (toDatetime && toDatetime > fromDatetime
        ? toDatetime
        : fromDatetime
      ).toISOString(),
      location: location.trim() || undefined,
      note: note.trim() || undefined,
      involvedPeople: selectedPeople.map((p) => p.id),
      imageUrl: imageUrl.trim() || undefined,
    };

    try {
      if (isEditing && activity) {
        await updateMutation.mutateAsync({
          participationId,
          activityId: activity.id,
          data: payload,
        });
        toast.success("Activity updated");
      } else {
        await createMutation.mutateAsync({ participationId, data: payload });
        toast.success("Activity added");
      }
      onDone();
    } catch {
      toast.error(
        isEditing ? "Failed to update activity" : "Failed to add activity",
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="border-primary/40 shadow-md">
      <CardHeader className="px-4 py-3 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            {isEditing ? "Edit Activity" : "New Activity"}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onDone}
              disabled={isPending}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleSave}
              disabled={isPending || !name.trim() || !fromDatetime}
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1" />
              )}
              {isEditing ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-3 space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="act-name" className="text-xs text-muted-foreground">
            Activity name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="act-name"
            ref={nameRef}
            placeholder="e.g. Morning hike"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") onDone();
            }}
          />
        </div>

        <Separator />

        {/* Start */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Start <span className="text-destructive">*</span>
          </p>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <DatePickerField
              id="act-from-date"
              label="Date"
              date={fromDate}
              onChange={handleFromDateChange}
              required
            />
            <TimePickerField
              id="act-from-time"
              label="Time"
              value={fromTime}
              onChange={handleFromTimeChange}
            />
          </div>
        </div>

        {/* End */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            End
            {durationText && !durationNegative && (
              <Badge
                variant="secondary"
                className="text-[10px] h-4 px-1.5 font-normal"
              >
                {durationText}
              </Badge>
            )}
            {durationNegative && (
              <Badge
                variant="destructive"
                className="text-[10px] h-4 px-1.5 font-normal"
              >
                Before start
              </Badge>
            )}
          </p>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <DatePickerField
              id="act-to-date"
              label="Date"
              date={toDate}
              fromDate={fromDate}
              onChange={setToDate}
            />
            <TimePickerField
              id="act-to-time"
              label="Time"
              value={toTime}
              onChange={setToTime}
            />
          </div>
        </div>

        <Separator />

        {/* Location */}
        <div className="space-y-1.5">
          <Label
            htmlFor="act-location"
            className="text-xs text-muted-foreground"
          >
            <MapPin className="h-3.5 w-3.5" />
            Location
          </Label>
          <Input
            id="act-location"
            placeholder="e.g. Base camp"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* People */}
        {(allUsers ?? []).length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Involved people
            </Label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-2 py-1.5 min-h-8">
              {selectedPeople.map((p) => (
                <Badge
                  key={p.id}
                  variant="secondary"
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 h-auto text-xs"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={p.image ?? undefined} />
                    <AvatarFallback className="text-[8px]">
                      {initials(p.name === p.id ? "?" : p.name)}
                    </AvatarFallback>
                  </Avatar>
                  {p.name === p.id ? p.id.slice(0, 8) + "\u2026" : p.name}
                  <button
                    type="button"
                    onClick={() => removePerson(p.id)}
                    className="ml-0.5 rounded-full hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Popover open={peopleOpen} onOpenChange={setPeopleOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground px-1 py-0.5 rounded hover:bg-muted"
                  >
                    + Add
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-56" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search members..."
                      value={peopleSearch}
                      onValueChange={setPeopleSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No members found</CommandEmpty>
                      {filteredPeople.map((u) => (
                        <CommandItem
                          key={u.id}
                          onSelect={() =>
                            addPerson({
                              id: u.id,
                              name: u.name,
                              image: u.image,
                            })
                          }
                        >
                          <Avatar className="h-5 w-5 mr-2">
                            <AvatarImage src={u.image ?? undefined} />
                            <AvatarFallback className="text-[9px]">
                              {initials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{u.name}</span>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <Separator />

        {/* Note */}
        <div className="space-y-1.5">
          <Label htmlFor="act-note" className="text-xs text-muted-foreground">
            Note
          </Label>
          <Textarea
            id="act-note"
            placeholder="Add a note... (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-sm min-h-0 h-16 resize-none"
          />
        </div>

        {/* Image URL */}
        <div className="space-y-1.5">
          <Label htmlFor="act-image" className="text-xs text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" />
            Cover photo URL
          </Label>
          <Input
            id="act-image"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="h-8 text-sm"
          />
          {imageUrl.trim() && (
            <div className="relative mt-1 h-28 w-full overflow-hidden rounded-md border border-input">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl.trim()}
                alt="Cover preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
