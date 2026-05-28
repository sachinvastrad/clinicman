"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Status = "scheduled" | "confirmed" | "arrived" | "in_progress" | "completed" | "cancelled" | "no_show";

const TRANSITIONS: Record<Status, { label: string; next: Status; variant: "default" | "danger" | "success" }[]> = {
  scheduled:   [{ label: "Confirm",     next: "confirmed",   variant: "default" }, { label: "Cancel", next: "cancelled", variant: "danger"  }],
  confirmed:   [{ label: "Mark Arrived",next: "arrived",     variant: "success" }, { label: "Cancel", next: "cancelled", variant: "danger"  }],
  arrived:     [{ label: "Start",       next: "in_progress", variant: "success" }, { label: "No Show",next: "no_show",   variant: "danger"  }],
  in_progress: [{ label: "Complete",    next: "completed",   variant: "success" }, { label: "Cancel", next: "cancelled", variant: "danger"  }],
  completed:   [],
  cancelled:   [],
  no_show:     [],
};

export function AppointmentActions({ id, status }: { id: string; status: string }) {
  const router     = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const transitions = TRANSITIONS[status as Status] ?? [];
  if (transitions.length === 0) return null;

  async function update(nextStatus: Status) {
    setBusy(nextStatus);
    await fetch(`/api/appointments/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: nextStatus }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="flex gap-1.5 shrink-0">
      {transitions.map(({ label, next, variant }) => (
        <button key={next} onClick={() => update(next)} disabled={busy !== null}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
            variant === "success" ? "bg-green-100 text-green-700 hover:bg-green-200"
            : variant === "danger"  ? "bg-red-100   text-red-700   hover:bg-red-200"
            : "border border-border hover:bg-muted"
          }`}>
          {busy === next && <Loader2 className="w-3 h-3 animate-spin" />}
          {label}
        </button>
      ))}
    </div>
  );
}
