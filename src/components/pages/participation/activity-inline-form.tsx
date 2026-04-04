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
  activity?: ActivityWithMedia;
  allUsers?: UserLike[];
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
    <Card className="border-2 border-primary/50 shadow-md bg-muted/30">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header row: title + action buttons */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {isEditing ? "Edit Activity" : "New Activity"}
            </p>
            <div className="flex gap-1 shrink-0">
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
                disabled={isPending || !name.trim() || !from}
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

          {/* Activity name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Activity name <span className="text-destructive">*</span>
            </label>
            <Input
              ref={nameRef}
              placeholder="e.g. Morning hike"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm font-semibold"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") onDone();
              }}
            />
          </div>

          {/* Date/time row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Clock className="h-3 w-3" />
                Start <span className="text-destructive">*</span>
              </label>
              <Input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Clock className="h-3 w-3" />
                End
              </label>
              <Input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3 w-3" />
              Location
            </label>
            <Input
              placeholder="e.g. Base camp"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* People */}
          {(allUsers ?? []).length > 0 && (
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Users className="h-3 w-3" />
                Involved people
              </label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 min-h-8">
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
                      className="text-xs text-muted-foreground hover:text-foreground px-1 py-0.5 rounded hover:bg-muted"
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
            </div>
          )}

          {/* Note */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Note
            </label>
            <Textarea
              placeholder="Add a note… (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-sm min-h-0 h-16 resize-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
