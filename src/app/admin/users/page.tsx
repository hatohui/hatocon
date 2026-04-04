"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ApiOk<T> = { data: T };

type AdminUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string | null;
  isAdmin: boolean;
  country: string;
  createdAt: string;
};

type EditState = {
  userId: string;
  field: "name" | "username" | "email";
  value: string;
};

const COUNTRY_LABELS: Record<string, string> = {
  VN: "Vietnam",
  SG: "Singapore",
};

function InlineTextCell({
  userId,
  field,
  value,
  onSave,
}: {
  userId: string;
  field: "name" | "username" | "email";
  value: string;
  onSave: (userId: string, field: string, value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const start = () => {
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) {
      onSave(userId, field, draft.trim());
    }
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className="h-7 w-full min-w-30 px-1.5 text-sm"
        autoFocus
      />
    );
  }

  return (
    <span
      className="block cursor-pointer rounded px-1 py-0.5 hover:bg-muted/60 transition-colors"
      onClick={start}
      title="Click to edit"
    >
      {value || <span className="text-muted-foreground italic">—</span>}
    </span>
  );
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState<"ALL" | "VN" | "SG">(
    "ALL",
  );
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "USER">("ALL");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (session && !session.user.isAdmin) router.replace("/");
  }, [session, router]);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () =>
      axios.get<ApiOk<AdminUser[]>>("/api/users").then((r) => r.data.data),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminUser> }) =>
      axios
        .put<ApiOk<AdminUser>>(`/api/users/${id}`, data)
        .then((r) => r.data.data),
    onSuccess: (updated) => {
      queryClient.setQueryData<AdminUser[]>(
        ["admin", "users"],
        (old) =>
          old?.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)) ??
          [],
      );
      toast.success("User updated");
    },
    onError: () => toast.error("Failed to update user"),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/users/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData<AdminUser[]>(
        ["admin", "users"],
        (old) => old?.filter((u) => u.id !== id) ?? [],
      );
      toast.success("User deleted");
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const handleFieldSave = (userId: string, field: string, value: string) => {
    updateUser.mutate({ id: userId, data: { [field]: value } });
  };

  const handleCountryChange = (userId: string, country: string) => {
    updateUser.mutate({ id: userId, data: { country } });
  };

  const handleAdminToggle = (userId: string, isAdmin: boolean) => {
    updateUser.mutate({ id: userId, data: { isAdmin } });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (users ?? []).filter((u) => {
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q);
      const matchesCountry =
        countryFilter === "ALL" || u.country === countryFilter;
      const matchesRole =
        roleFilter === "ALL" ||
        (roleFilter === "ADMIN" ? u.isAdmin : !u.isAdmin);
      return matchesSearch && matchesCountry && matchesRole;
    });
  }, [users, search, countryFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const deleteTarget = users?.find((u) => u.id === deleteId);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Click any cell to edit it inline.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {users?.length ?? 0} users
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, username…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>

        <Select
          value={countryFilter}
          onValueChange={(v) => {
            setCountryFilter(v as typeof countryFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All countries</SelectItem>
            <SelectItem value="VN">Vietnam</SelectItem>
            <SelectItem value="SG">Singapore</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v as typeof roleFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            <SelectItem value="ADMIN">Admin only</SelectItem>
            <SelectItem value="USER">User only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="text-center">Admin</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-10 text-muted-foreground text-sm"
                >
                  No users match the filters.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((user) => {
                const initials = user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                const isSelf = user.id === session?.user?.id;

                return (
                  <TableRow key={user.id} className="group">
                    {/* Avatar */}
                    <TableCell>
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={user.image ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>

                    {/* Name */}
                    <TableCell className="min-w-35">
                      <InlineTextCell
                        userId={user.id}
                        field="name"
                        value={user.name}
                        onSave={handleFieldSave}
                      />
                    </TableCell>

                    {/* Username */}
                    <TableCell className="min-w-30">
                      <InlineTextCell
                        userId={user.id}
                        field="username"
                        value={user.username ?? ""}
                        onSave={handleFieldSave}
                      />
                    </TableCell>

                    {/* Email */}
                    <TableCell className="min-w-45">
                      <InlineTextCell
                        userId={user.id}
                        field="email"
                        value={user.email}
                        onSave={handleFieldSave}
                      />
                    </TableCell>

                    {/* Country */}
                    <TableCell className="min-w-40">
                      <Select
                        value={user.country}
                        onValueChange={(v) => handleCountryChange(user.id, v)}
                      >
                        <SelectTrigger className="h-7 w-37.5 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(COUNTRY_LABELS).map(([v, label]) => (
                            <SelectItem key={v} value={v}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Admin toggle */}
                    <TableCell className="text-center">
                      <Switch
                        checked={user.isAdmin}
                        disabled={isSelf}
                        onCheckedChange={(v) => handleAdminToggle(user.id, v)}
                        title={
                          isSelf
                            ? "Cannot change your own admin status"
                            : undefined
                        }
                      />
                    </TableCell>

                    {/* Created */}
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>

                    {/* Delete */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        disabled={isSelf}
                        onClick={() => setDeleteId(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} ({filtered.length} of{" "}
            {users?.length ?? 0} users)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>{" "}
              ({deleteTarget?.email}) and all their data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteUser.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
