"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([
    {
      id: "1",
      type: "info",
      title: "Case Review Required",
      description: "John Sharma's constitutional profile and analysis is ready for review.",
      time: "10m ago",
      read: false,
    },
    {
      id: "2",
      type: "warning",
      title: "Low Stock Warning",
      description: "Arsenicum Album 30C dilution falls below 10% inventory threshold.",
      time: "1h ago",
      read: false,
    },
    {
      id: "3",
      type: "error",
      title: "Billing Escalation",
      description: "Invoice #INV-2901 for Patient Vijay Patel overdue by 4 days.",
      time: "3h ago",
      read: true,
    },
    {
      id: "4",
      type: "success",
      title: "WhatsApp Enquiry",
      description: "New homeopathic survey intake form submitted by Lakshmi A.",
      time: "Yesterday",
      read: true,
    },
  ]);

  const unreadCount = React.useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markSingleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const renderIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "warning":
        return <Icons.AlertTriangle className="w-4 h-4 text-warning" />;
      case "error":
        return <Icons.AlertCircle className="w-4 h-4 text-danger" />;
      case "success":
        return <Icons.CheckCircle2 className="w-4 h-4 text-success" />;
      default:
        return <Icons.Info className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          aria-label={`Notifications, ${unreadCount} unread`}
          className="relative p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus group"
        >
          <Icons.Bell className={cn("w-4 h-4 transition-transform duration-slow", unreadCount > 0 && "group-hover:animate-pulse-ring")} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-pill bg-danger ring-2 ring-background animate-pulse" />
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 sm:w-96 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl outline-none transition-all duration-fast animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-primary-soft-foreground">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto p-1 divide-y divide-border-subtle">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground-2">
                <Icons.BellOff className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs">All clear! No alerts.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markSingleRead(n.id)}
                  className={cn(
                    "flex gap-3 p-3 text-left rounded-md transition-colors duration-fast",
                    !n.read ? "bg-background-subtle cursor-pointer hover:bg-secondary/40" : "hover:bg-secondary/20"
                  )}
                >
                  <div className="mt-0.5 shrink-0">{renderIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-xs font-semibold truncate", !n.read ? "text-foreground" : "text-muted-foreground")}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground-2 shrink-0">{n.time}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground-2 leading-normal">
                      {n.description}
                    </p>
                  </div>
                  {!n.read && (
                    <span aria-hidden className="w-1.5 h-1.5 rounded-pill bg-primary shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border px-4 py-2 bg-background-subtle rounded-b-xl text-center">
            <button
              onClick={() => alert("Notification panel details expanded.")}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              View all clinical logs <Icons.ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
