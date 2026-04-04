"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import zod from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMe,
  useUpdateMe,
  useChangePassword,
  useUploadAvatar,
} from "@/hooks/users/useMe";
import { Camera, Loader2 } from "lucide-react";
import ImageCropDialog from "@/components/ImageCropDialog";

const profileSchema = zod.object({
  name: zod.string().min(1, "Name is required"),
  username: zod
    .string()
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores")
    .min(3, "At least 3 characters")
    .max(20, "At most 20 characters"),
});

const countrySchema = zod.object({
  country: zod.enum(["VN", "SG"]),
});

type CountryValues = zod.infer<typeof countrySchema>;

const COUNTRY_OPTIONS = [
  { value: "VN", label: "Vietnam" },
  { value: "SG", label: "Singapore" },
] as const;

const passwordSchema = zod
  .object({
    currentPassword: zod.string().min(1, "Required"),
    newPassword: zod
      .string()
      .min(8, "At least 8 characters")
      .max(20, "At most 20 characters")
      .regex(/(?=.*[a-z])/, "Must contain a lowercase letter")
      .regex(/(?=.*[A-Z])/, "Must contain an uppercase letter")
      .regex(/(?=.*\d)/, "Must contain a number")
      .regex(/(?=.*[@$!%*?&])/, "Must contain a special character (@$!%*?&)"),
    confirmPassword: zod.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileValues = zod.infer<typeof profileSchema>;
type PasswordValues = zod.infer<typeof passwordSchema>;

function AvatarSection() {
  const { data: me } = useMe();
  const uploadAvatar = useUploadAvatar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  const initials = me?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setCropFile(file);
  };

  const handleCropComplete = (cropped: File | null) => {
    setCropFile(null);
    if (!cropped) return;
    uploadAvatar.mutate(cropped);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>Upload a profile picture.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={me?.image ?? undefined} />
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>
          {uploadAvatar.isPending && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={uploadAvatar.isPending}
            onClick={() => fileRef.current?.click()}
          >
            <Camera className="mr-2 h-4 w-4" />
            Change photo
          </Button>
          {uploadAvatar.isError && (
            <p className="text-sm text-destructive">
              Upload failed. Try again.
            </p>
          )}
        </div>
      </CardContent>
      <ImageCropDialog
        file={cropFile}
        aspect={1}
        maxWidth={256}
        quality={0.85}
        onComplete={handleCropComplete}
      />
    </Card>
  );
}

function ProfileInfoSection() {
  const { data: me } = useMe();
  const updateMe = useUpdateMe();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { name: me?.name ?? "", username: me?.username ?? "" },
  });

  const onSubmit = (values: ProfileValues) => {
    updateMe.mutate(values, {
      onSuccess: () => form.reset(values),
      onError: (err) => {
        const msg =
          (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message ?? "Update failed.";
        form.setError("root", { message: msg });
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Info</CardTitle>
        <CardDescription>
          Update your display name and username.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            {updateMe.isSuccess && (
              <p className="text-sm text-green-600">Profile updated.</p>
            )}
            <Button
              type="submit"
              disabled={updateMe.isPending || !form.formState.isDirty}
            >
              {updateMe.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function CountrySection() {
  const { data: me } = useMe();
  const updateMe = useUpdateMe();

  const form = useForm<CountryValues>({
    resolver: zodResolver(countrySchema),
    values: { country: (me?.country ?? "VN") as "VN" | "SG" },
  });

  const onSubmit = (values: CountryValues) => {
    updateMe.mutate(values, {
      onSuccess: () => form.reset(values),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Country</CardTitle>
        <CardDescription>
          Your country determines which public holidays apply to your leave
          balance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {updateMe.isSuccess && (
              <p className="text-sm text-green-600">Country updated.</p>
            )}
            <Button
              type="submit"
              disabled={updateMe.isPending || !form.formState.isDirty}
            >
              {updateMe.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PasswordSection() {
  const changePassword = useChangePassword();

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: PasswordValues) => {
    changePassword.mutate(values, {
      onSuccess: () => form.reset(),
      onError: (err) => {
        const msg =
          (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message ?? "Password change failed.";
        form.setError("root", { message: msg });
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password. Must be 8–20 characters with uppercase,
          lowercase, number, and special character.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            {changePassword.isSuccess && (
              <p className="text-sm text-green-600">Password updated.</p>
            )}
            <Button
              type="submit"
              disabled={changePassword.isPending || !form.formState.isDirty}
            >
              {changePassword.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update password
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function SettingsProfilePage() {
  const { data: me, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AvatarSection />
      <ProfileInfoSection />
      <CountrySection />
      {me?.hasPassword && <PasswordSection />}
    </div>
  );
}
