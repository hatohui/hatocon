"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Check, Clock, Loader2, MapPin, Users, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

function formatDateTimeLocal(date: Date | string) {
  return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
}

export default function ActivityInlineForm({
  participationId,
  activity,
  allUsers,
  onDone,
}: {
  participationId: string;
  activity?: ActivityWithMedia | null;
  allUsers?: {
    id: string;
    name: string;
    image: string | null;
    email: string;
  }[];
  onDone: () => void;
}) {
  const isEditing = !!activity;
  const createMutation = useCreateActivity();
  const updateMutation = useUpdateActivity();

  const [name, setName] = useState(activity?.name ?? "");
  const [from, setFrom] = useState(
    activity?.from ? formatDateTimeLocal(activity.from) : "",
  );
  const [to, setTo] = useState(
    activity?.to ? formatDateTimeLocal(activity.to) : "",
  );
  const [location, setLocation] = useState(activity?.location ?? "");
  const [note, setNote] = useState(activity?.note ?? "");
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

  // Backend-scoped search — only returns members of this participation
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
    if (!from) {
      toast.error("Start date/time is required");
      return;
    }

    const payload = {
      name: name.trim(),
      from: new Date(from).toISOString(),
      to: to ? new Date(to).toISOString() : new Date(from).toISOString(),
      location: location.trim() || undefined,
      note: note.trim() || undefined,
      involvedPeople: selectedPeople.map((p) => p.id),
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
    <Card className="border-2 border-primary/40 shadow-sm">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Content — matches ActivityCard layout */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Name row + compact save/cancel */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-0.5">
                <Input
                  ref={nameRef}
                  placeholder="Activity name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-7 p-0 font-semibold text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 leading-tight"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") onDone();
                  }}
                />
                {/* Dates — same style as ActivityCard time row */}
                <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" />
                  <Input
                    type="datetime-local"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-6 p-0 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0 w-auto max-w-38"
                  />
                  <span className="text-muted-foreground/60">–</span>
                  <Input
                    type="datetime-local"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-6 p-0 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0 w-auto max-w-38"
                  />
                </div>
              </div>
              {/* Compact icon buttons */}
              <div className="flex gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onDone}
                  disabled={isPending}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleSave}
                  disabled={isPending || !name.trim() || !from}
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Location — matches ActivityCard location row */}
            <div className="flex items-center gap-1.5 text-xs">
              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
              <Input
                placeholder="Location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-6 p-0 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
            </div>

            {/* People — matches ActivityCard people row */}
            {(allUsers ?? []).length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                {selectedPeople.map((p) => (
                  <Badge
                    key={p.id}
                    variant="secondary"
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium h-auto"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={p.image ?? undefined} />
                      <AvatarFallback className="text-[8px]">
                        {initials(p.name === p.id ? "?" : p.name)}
                      </AvatarFallback>
                    </Avatar>
                    {p.name === p.id ? p.id.slice(0, 8) + "…" : p.name}
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
                      className="text-xs text-muted-foreground hover:text-foreground px-1"
                    >
                      + Add
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-56" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search members…"
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
            )}

            {/* Note — matches ActivityCard note display */}
            <Textarea
              placeholder="Add a note… (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-xs min-h-0 h-14 resize-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
