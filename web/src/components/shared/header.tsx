"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NotificationCenter } from "@/components/shared/notification-center";

interface Crumb {
  label: string;
  href?: string;
}

interface HeaderProps {
  title: string;
  crumbs?: Crumb[];
  action?: React.ReactNode;
  /** Hide the patient quick-search (e.g. on pages with their own search). */
  hideSearch?: boolean;
}

export function Header({ title, crumbs, action, hideSearch }: HeaderProps) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/patients?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="h-14 shrink-0 sticky top-0 z-10 flex items-center gap-4 px-6 border-b border-border bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2 min-w-0">
        {crumbs?.map((c, i) => (
          <span key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
            {c.href ? (
              <Link href={c.href} className="hover:text-foreground transition-colors duration-fast">
                {c.label}
              </Link>
            ) : (
              c.label
            )}
            <span className="text-border-strong select-none">/</span>
          </span>
        ))}
        <h1 className="text-sm font-semibold text-foreground tracking-tight truncate">{title}</h1>
      </div>

      {!hideSearch && (
        <form onSubmit={handleSearch} className="flex-1 max-w-sm ml-2 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground-2 pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search patients…"
              aria-label="Search patients"
              className="w-full h-9 pl-9 pr-3 text-sm rounded-md bg-background-subtle border border-border text-foreground placeholder:text-muted-foreground-2 outline-none transition-[border-color,box-shadow,background-color] duration-fast hover:border-border-strong focus-visible:border-primary focus-visible:bg-background focus-visible:shadow-focus"
            />
          </div>
        </form>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {action}
        <NotificationCenter />
      </div>
    </header>
  );
}
