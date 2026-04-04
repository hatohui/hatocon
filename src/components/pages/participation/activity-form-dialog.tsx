"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { format } from "date-fns";
import { Camera, Loader2, X } from "lucide-react";
import Image from "next/image";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import {
  useCreateActivity,
  useUpdateActivity,
  useUploadActivityImage,
} from "@/hooks/activities/useActivities";
import { useSearchUsers } from "@/hooks/users/useUsers";
import { ActivityWithMedia } from "@/types/activity.d";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

type FormValues = {
  name: string;
  from: string;
  to: string;
  location: string;
  locationUrl: string;
  note: string;
  involvedPeople: string[];
  imageUrl: string;
};

function formatDateTimeLocal(date: Date | string) {
  const d = new Date(date);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

export default function ActivityFormDialog({
  open,
  onOpenChange,
  participationId,
  activity,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participationId: string;
  activity?: ActivityWithMedia | null;
}) {
  const isEditing = !!activity;
  const createMutation = useCreateActivity();
  const updateMutation = useUpdateActivity();
  const uploadImageMutation = useUploadActivityImage();

  const [peopleOpen, setPeopleOpen] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<
    { id: string; name: string; image: string | null }[]
  >([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: searchedUsers } = useSearchUsers(peopleSearch);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      from: "",
      to: "",
      location: "",
      locationUrl: "",
      note: "",
      involvedPeople: [],
      imageUrl: "",
    },
  });

  // Prepopulate when editing
  useEffect(() => {
    if (activity && open) {
      reset({
        name: activity.name,
        from: formatDateTimeLocal(activity.from),
        to: formatDateTimeLocal(activity.to),
        location: activity.location ?? "",
        locationUrl: activity.locationUrl ?? "",
        note: activity.note ?? "",
        involvedPeople: activity.involvedPeople,
        imageUrl: activity.imageUrl ?? "",
      });
      setImagePreview(activity.imageUrl ?? null);
      // We would need to look up user details for involvedPeople
      // For now, store IDs and names will be shown when available
      setSelectedPeople(
        activity.involvedPeople.map((id) => ({
          id,
          name: id,
          image: null,
        })),
      );
    } else if (!activity && open) {
      reset({
        name: "",
        from: "",
        to: "",
        location: "",
        locationUrl: "",
        note: "",
        involvedPeople: [],
        imageUrl: "",
      });
      setSelectedPeople([]);
      setImagePreview(null);
      setImageFile(null);
    }
  }, [activity, open, reset]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10 MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setValue("imageUrl", "");
  };

  const addPerson = (user: {
    id: string;
    name: string;
    image: string | null;
  }) => {
    if (selectedPeople.some((p) => p.id === user.id)) return;
    setSelectedPeople((prev) => [...prev, user]);
    setPeopleOpen(false);
    setPeopleSearch("");
  };

  const removePerson = (id: string) => {
    setSelectedPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      let imageUrl = values.imageUrl;

      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImageMutation.mutateAsync({
          participationId,
          file: imageFile,
        });
      }

      const payload = {
        name: values.name,
        from: new Date(values.from).toISOString(),
        to: values.to
          ? new Date(values.to).toISOString()
          : new Date(values.from).toISOString(),
        location: values.location || undefined,
        locationUrl: values.locationUrl || undefined,
        note: values.note || undefined,
        involvedPeople: selectedPeople.map((p) => p.id),
        imageUrl: imageUrl || undefined,
      };

      if (isEditing && activity) {
        await updateMutation.mutateAsync({
          participationId,
          activityId: activity.id,
          data: payload,
        });
        toast.success("Activity updated");
      } else {
        await createMutation.mutateAsync({
          participationId,
          data: payload,
        });
        toast.success("Activity created");
      }

      onOpenChange(false);
    } catch {
      toast.error(
        isEditing ? "Failed to update activity" : "Failed to create activity",
      );
    }
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadImageMutation.isPending;

  const filteredUsers = searchedUsers?.filter(
    (u) => !selectedPeople.some((p) => p.id === u.id),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Activity" : "Add Activity"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="activity-name">Name *</Label>
            <Input
              id="activity-name"
              placeholder="e.g., Arrive to Vietnam"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="activity-from">From *</Label>
              <Input
                id="activity-from"
                type="datetime-local"
                {...register("from", { required: "Start date is required" })}
              />
              {errors.from && (
                <p className="text-xs text-destructive">
                  {errors.from.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="activity-to">To</Label>
              <Input
                id="activity-to"
                type="datetime-local"
                {...register("to")}
              />
              <p className="text-[10px] text-muted-foreground">
                Leave empty for single point in time
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="activity-location">Location</Label>
              <Input
                id="activity-location"
                placeholder="Ho Chi Minh City"
                {...register("location")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="activity-locationUrl">Location URL</Label>
              <Input
                id="activity-locationUrl"
                placeholder="https://maps.google.com/..."
                {...register("locationUrl")}
              />
            </div>
          </div>

          {/* Involved People */}
          <div className="space-y-1.5">
            <Label>Involved People</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedPeople.map((p) => (
                <Badge key={p.id} variant="secondary" className="gap-1 pr-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={p.image ?? undefined} />
                    <AvatarFallback className="text-[8px]">
                      {initials(p.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{p.name}</span>
                  <button
                    type="button"
                    onClick={() => removePerson(p.id)}
                    className="ml-0.5 h-4 w-4 flex items-center justify-center rounded-full hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Popover open={peopleOpen} onOpenChange={setPeopleOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  Add Person
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-64" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search users..."
                    value={peopleSearch}
                    onValueChange={setPeopleSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {peopleSearch.length < 1
                        ? "Type to search..."
                        : "No users found"}
                    </CommandEmpty>
                    {filteredUsers?.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() =>
                          addPerson({
                            id: user.id,
                            name: user.name,
                            image: user.image,
                          })
                        }
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={user.image ?? undefined} />
                          <AvatarFallback className="text-[10px]">
                            {initials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="activity-note">Note</Label>
            <Textarea
              id="activity-note"
              placeholder="Plane ticket details, hotel booking, etc."
              rows={3}
              {...register("note")}
            />
          </div>

          {/* Reference Image */}
          <div className="space-y-1.5">
            <Label>Reference Image</Label>
            {imagePreview ? (
              <div className="relative inline-block">
                <Image
                  src={imagePreview}
                  alt="Activity reference"
                  width={200}
                  height={120}
                  className="rounded-lg object-cover"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <Camera className="h-4 w-4 mr-1.5" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
