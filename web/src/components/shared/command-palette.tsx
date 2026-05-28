"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import * as Icons from "lucide-react";
import { NAV_ITEMS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  userRole?: "admin" | "doctor" | "receptionist";
}

export function CommandPalette({ userRole = "admin" }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((handler: () => void) => {
    setOpen(false);
    handler();
  }, []);

  // Filter nav items based on user permission (if item requires permission, mock true for simplicity or link to hasPermission)
  const visibleNavs = React.useMemo(() => {
    return NAV_ITEMS.filter((item) => {
      if (!item.permission) return true;
      // Allow if role matches (admin has all permissions, other roles check PERMISSIONS)
      if (userRole === "admin") return true;
      if (userRole === "doctor" && ["clinical:write", "whatsapp:clinical_send", "appointments:block"].includes(item.permission)) return true;
      if (userRole === "receptionist" && ["billing:write", "inventory:write", "leads:write", "finance:daily_cash", "whatsapp:inbox"].includes(item.permission)) return true;
      return false;
    });
  }, [userRole]);

  // Map icon strings to dynamic Lucide components
  const renderIcon = (name: string, className = "w-4 h-4 text-muted-foreground-2") => {
    const IconComponent = (Icons as any)[name];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    return <Icons.FileText className={className} />;
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        {/* Backdrop Glassmorphism Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/40 backdrop-blur-md transition-opacity duration-fast animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[35%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl transition-all duration-fast animate-in fade-in zoom-in-95">
          <Command className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-popover">
            <div className="flex items-center border-b border-border px-4" cmdk-input-wrapper="">
              <Icons.Search className="mr-2 h-4 w-4 shrink-0 opacity-60" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Type a command or search..."
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                onClick={() => setOpen(false)}
                className="ml-2 rounded-sm p-1 hover:bg-secondary transition-colors"
                aria-label="Close command palette"
              >
                <Icons.X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" />
              </button>
            </div>
            
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground-2">
                No results found.
              </Command.Empty>
              
              <Command.Group heading="Navigation" className="px-2 text-xs font-semibold text-muted-foreground-2 uppercase tracking-[0.12em] mb-1">
                {visibleNavs.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={item.label}
                    onSelect={() => runCommand(() => router.push(item.href))}
                    className="relative flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-secondary focus:bg-secondary data-[selected=true]:bg-secondary transition-colors duration-fast"
                  >
                    {renderIcon(item.icon)}
                    <span className="flex-1">{item.label}</span>
                    <Icons.CornerDownLeft className="h-3 w-3 opacity-0 group-hover:opacity-60 data-[selected=true]:opacity-60 text-muted-foreground-2" />
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Quick Actions" className="mt-2 px-2 text-xs font-semibold text-muted-foreground-2 uppercase tracking-[0.12em] mb-1">
                <Command.Item
                  value="Register new patient record"
                  onSelect={() => runCommand(() => router.push("/patients/new"))}
                  className="relative flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-secondary data-[selected=true]:bg-secondary transition-colors duration-fast"
                >
                  <Icons.UserPlus className="w-4 h-4 text-muted-foreground-2" />
                  <span className="flex-1">Register New Patient</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground-2">
                    N
                  </kbd>
                </Command.Item>
                <Command.Item
                  value="Book doctor consultation appointment"
                  onSelect={() => runCommand(() => router.push("/appointments"))}
                  className="relative flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-secondary data-[selected=true]:bg-secondary transition-colors duration-fast"
                >
                  <Icons.Calendar className="w-4 h-4 text-muted-foreground-2" />
                  <span className="flex-1">Book Appointment</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground-2">
                    B
                  </kbd>
                </Command.Item>
                <Command.Item
                  value="Create consult billing invoice"
                  onSelect={() => runCommand(() => router.push("/billing/new"))}
                  className="relative flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-secondary data-[selected=true]:bg-secondary transition-colors duration-fast"
                >
                  <Icons.Receipt className="w-4 h-4 text-muted-foreground-2" />
                  <span className="flex-1">Create Invoice</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground-2">
                    I
                  </kbd>
                </Command.Item>
              </Command.Group>
            </Command.List>

            <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground-2 bg-background-subtle">
              <span className="flex items-center gap-1">
                Use <Icons.ArrowUp className="w-3 h-3" /><Icons.ArrowDown className="w-3 h-3" /> to navigate,
                <kbd className="border border-border rounded px-1 bg-muted">Enter</kbd> to select
              </span>
              <span>
                <kbd className="border border-border rounded px-1 bg-muted">Esc</kbd> to close
              </span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
