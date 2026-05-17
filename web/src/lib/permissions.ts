import type { Role } from "@/types";

export const PERMISSIONS = {
  "patients:write":          ["admin", "doctor", "receptionist"],
  "patients:delete":         ["admin"],
  "clinical:write":          ["admin", "doctor"],
  "billing:write":           ["admin", "receptionist"],
  "inventory:write":         ["admin", "receptionist"],
  "leads:write":             ["admin", "receptionist"],
  "finance:view":            ["admin"],
  "finance:daily_cash":      ["admin", "receptionist"],
  "staff:manage":            ["admin"],
  "whatsapp:inbox":          ["admin", "receptionist"],
  "whatsapp:clinical_send":  ["admin", "doctor"],
  "reports:view":            ["admin"],
  "settings:manage":         ["admin"],
  "appointments:block":      ["admin", "doctor"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export const NAV_ITEMS = [
  { label: "Dashboard",    href: "/dashboard",      icon: "LayoutDashboard", permission: null },
  { label: "Patients",     href: "/patients",       icon: "Users",           permission: null },
  { label: "Appointments", href: "/appointments",   icon: "Calendar",        permission: null },
  { label: "Prescriptions",href: "/prescriptions",  icon: "FileText",        permission: "clinical:write" as Permission },
  { label: "Billing",      href: "/billing",        icon: "Receipt",         permission: "billing:write" as Permission },
  { label: "Inventory",    href: "/inventory",      icon: "Package",         permission: "inventory:write" as Permission },
  { label: "Leads",        href: "/leads",          icon: "TrendingUp",      permission: "leads:write" as Permission },
  { label: "WhatsApp",     href: "/whatsapp",       icon: "MessageCircle",   permission: "whatsapp:inbox" as Permission },
  { label: "Finance",      href: "/finance",        icon: "BarChart3",       permission: "finance:view" as Permission },
  { label: "Reports",      href: "/reports",        icon: "PieChart",        permission: "reports:view" as Permission },
  { label: "Staff",        href: "/settings/staff", icon: "Shield",          permission: "staff:manage" as Permission },
  { label: "Settings",     href: "/settings",       icon: "Settings",        permission: "settings:manage" as Permission },
] as const;
