"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, Calendar, FileText, Receipt, Package,
  TrendingUp, MessageCircle, BarChart3, PieChart, Shield, Settings,
  LogOut, Activity, Salad, AlertCircle, Layers, Truck,
  PackagePlus, Kanban, Sparkles, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, hasPermission } from "@/lib/permissions";
import type { AuthUser } from "@/types";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Calendar, FileText, Receipt, Package,
  TrendingUp, MessageCircle, BarChart3, PieChart, Shield, Settings,
  Activity, Salad, AlertCircle, Layers, Truck, PackagePlus, Kanban, Sparkles,
};

type NavItem = (typeof NAV_ITEMS)[number];

const GROUPS: { id: string; label: string; match: (href: string) => boolean }[] = [
  { id: "overview",  label: "Overview",  match: (h) => h === "/dashboard" },
  { id: "clinical",  label: "Clinical",  match: (h) => ["/patients", "/appointments", "/prescriptions", "/yoga-library", "/diet-templates", "/magic-diet"].some((p) => h.startsWith(p)) },
  { id: "billing",   label: "Billing",   match: (h) => h.startsWith("/billing") },
  { id: "inventory", label: "Inventory", match: (h) => h.startsWith("/inventory") },
  { id: "growth",    label: "Growth",    match: (h) => h.startsWith("/leads") || h.startsWith("/whatsapp") },
  { id: "insights",  label: "Insights",  match: (h) => h.startsWith("/finance") || h.startsWith("/reports") },
  { id: "system",    label: "System",    match: (h) => h.startsWith("/settings") },
];

interface SidebarProps {
  user: AuthUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(user.role, item.permission)
  );

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: visibleItems.filter((i) => g.match(i.href)),
  })).filter((g) => g.items.length > 0);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/login");
    router.refresh();
  }

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="flex flex-col h-full w-[260px] bg-sidebar border-r border-sidebar-border">
      {/* Brand — aligned to header height (h-14) */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border shrink-0">
        <img src="/logo.png" alt="" className="h-7 w-7 object-contain shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-tight leading-tight truncate">
            Sachi Homeopathic
          </p>
          <p className="text-[11px] text-sidebar-muted capitalize leading-tight">{user.role}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {grouped.map((group) => {
          const isOpen = !collapsed[group.id];
          return (
            <div key={group.id}>
              <button
                onClick={() => setCollapsed((s) => ({ ...s, [group.id]: !s[group.id] }))}
                className="w-full flex items-center justify-between px-2 mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sidebar-muted hover:text-foreground transition-colors duration-fast rounded-sm focus-visible:outline-none focus-visible:shadow-focus"
              >
                <span>{group.label}</span>
                <ChevronDown
                  className={cn("w-3 h-3 transition-transform duration-fast", !isOpen && "-rotate-90")}
                />
              </button>
              {isOpen && (
                <div className="space-y-0.5">
                  {group.items.map((item: NavItem) => {
                    const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
                    const active =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-2.5 h-8 px-2.5 rounded-md text-sm font-medium",
                          "transition-[background-color,color] duration-fast ease-out",
                          "focus-visible:outline-none focus-visible:shadow-focus",
                          active
                            ? "bg-sidebar-accent text-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-foreground"
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-pill bg-primary" />
                        )}
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            active ? "text-primary" : "text-sidebar-muted group-hover:text-foreground"
                          )}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-2 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors duration-fast">
          <div className="w-8 h-8 rounded-pill bg-primary-soft text-primary-soft-foreground flex items-center justify-center text-xs font-semibold tabular">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate leading-tight">{user.fullName}</p>
            <p className="text-[11px] text-sidebar-muted truncate">{user.phone}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Sign out"
            className="p-1.5 rounded-sm text-sidebar-muted hover:text-danger hover:bg-danger-soft transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
