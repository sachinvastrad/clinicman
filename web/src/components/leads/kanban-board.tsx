"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Phone, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

const COLUMN_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  not_interested: "Not Interested",
  converted: "Converted",
  lost: "Lost",
};

const COLUMN_COLORS: Record<string, string> = {
  new: "bg-blue-50 border-blue-200",
  contacted: "bg-yellow-50 border-yellow-200",
  interested: "bg-teal-50 border-teal-200",
  not_interested: "bg-gray-50 border-gray-200",
  converted: "bg-green-50 border-green-200",
  lost: "bg-red-50 border-red-200",
};

const BADGE_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  interested: "bg-teal-100 text-teal-700",
  not_interested: "bg-gray-100 text-gray-600",
  converted: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

interface Lead {
  id: string;
  fullName: string;
  phone: string;
  source?: string | null;
  status: string;
  interestedIn?: string | null;
  followUpDate?: Date | string | null;
  createdAt: Date | string;
}

interface Props {
  initialGrouped: Record<string, Lead[]>;
}

export function KanbanBoard({ initialGrouped }: Props) {
  const [grouped, setGrouped] = useState<Record<string, Lead[]>>(initialGrouped);
  const dragLead = useRef<Lead | null>(null);
  const dragFrom = useRef<string | null>(null);

  function onDragStart(lead: Lead, fromCol: string) {
    dragLead.current = lead;
    dragFrom.current = fromCol;
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function onDrop(toCol: string) {
    const lead = dragLead.current;
    const fromCol = dragFrom.current;
    if (!lead || !fromCol || fromCol === toCol) return;

    // Optimistic update
    setGrouped((prev) => {
      const next = { ...prev };
      next[fromCol] = next[fromCol].filter((l) => l.id !== lead.id);
      next[toCol] = [{ ...lead, status: toCol }, ...next[toCol]];
      return next;
    });

    // Persist
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: toCol }),
    });

    dragLead.current = null;
    dragFrom.current = null;
  }

  const columns = Object.keys(COLUMN_LABELS);

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {columns.map((col) => {
        const leads = grouped[col] ?? [];
        return (
          <div
            key={col}
            className={`flex-shrink-0 w-64 rounded-xl border ${COLUMN_COLORS[col]} flex flex-col`}
            onDragOver={onDragOver}
            onDrop={() => onDrop(col)}
          >
            {/* Column header */}
            <div className="px-3 py-2.5 border-b border-inherit flex items-center justify-between">
              <span className="text-sm font-semibold">{COLUMN_LABELS[col]}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_COLORS[col]}`}>
                {leads.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {leads.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">Drop leads here</p>
              )}
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => onDragStart(lead, col)}
                  className="bg-card rounded-lg border border-border p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                >
                  <Link href={`/leads/${lead.id}`} className="block">
                    <p className="text-sm font-medium truncate hover:text-primary transition-colors">{lead.fullName}</p>
                    {lead.interestedIn && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{lead.interestedIn}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{lead.phone}</span>
                    </div>
                    {lead.followUpDate && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Follow-up: {formatDate(lead.followUpDate as string)}</span>
                      </div>
                    )}
                    {lead.source && (
                      <p className="text-xs text-muted-foreground mt-1 capitalize">{lead.source.replace("_", " ")}</p>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
