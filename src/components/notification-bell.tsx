"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useUnreadNotificationCount } from "@/hooks/notifications/useNotifications";
import NotificationList from "@/components/notification-list";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadCount } = useUnreadNotificationCount();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {!!unreadCount && unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-auto overflow-hidden"
        align="end"
        sideOffset={8}
      >
        <NotificationList onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
