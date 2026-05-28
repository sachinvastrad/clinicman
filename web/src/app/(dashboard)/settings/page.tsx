import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, Building2, Bell, Shield, Database } from "lucide-react";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const cards = [
    user.role === "admin" && {
      href: "/settings/staff",
      icon: Users,
      title: "Staff Management",
      description: "Add, edit, or deactivate staff accounts and manage roles",
    },
    user.role === "admin" && {
      href: "/settings/clinic",
      icon: Building2,
      title: "Clinic Settings",
      description: "Update clinic name, address, working hours, and branding",
    },
    {
      href: "/settings/notifications",
      icon: Bell,
      title: "Notification Preferences",
      description: "Configure reminder timings and WhatsApp message templates",
    },
    user.role === "admin" && {
      href: "/settings/database",
      icon: Database,
      title: "Database Backup & Restore",
      description: "Manage database backup files, trigger manual backups, and restore previous clinic data",
    },
    user.role === "admin" && {
      href: "/settings/security",
      icon: Shield,
      title: "Security & Audit",
      description: "View audit logs, active sessions, and access controls",
    },
  ].filter(Boolean) as { href: string; icon: React.ElementType; title: string; description: string }[];

  return (
    <>
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div>
          <h2 className="font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your clinic configuration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map(({ href, icon: Icon, title, description }) => (
            <Link key={href} href={href}
              className="bg-card rounded-xl border border-border p-5 hover:bg-muted/30 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium group-hover:text-primary transition-colors">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
