"use client";

import { Activity, Calendar, Stethoscope, ChevronRight, FileText, Heart, CheckCircle2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";

interface VisitWithDetails {
  id: string;
  visitDate: Date | string;
  visitType: string | null;
  chiefComplaint: string | null;
  improvementScore: number | null;
  status: string;
  prescription?: {
    items: { id: string; remedyName: string }[];
  } | null;
  vitals?: {
    id: string;
    bp?: string | null;
    pulse?: number | null;
    temperature?: any | null;
  } | null;
}

interface ActivityTimelineProps {
  visits: VisitWithDetails[];
  patientId: string;
}

export function ActivityTimeline({ visits, patientId }: ActivityTimelineProps) {
  if (visits.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground bg-card rounded-xl border border-border">
        No clinical activity logged yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-primary/60 before:via-primary/20 before:to-transparent">
      {visits.map((visit) => {
        const isCompleted = visit.status === "completed" || visit.status === "locked";
        const hasPrescription = visit.prescription && visit.prescription.items.length > 0;
        
        return (
          <div key={visit.id} className="relative group">
            {/* Timeline dot with glowing radial focus indicator */}
            <span className="absolute -left-[21px] top-1.5 flex h-4 w-4 items-center justify-center rounded-pill bg-card border-2 border-primary z-10 transition-all duration-slow group-hover:scale-110">
              <span className={cn(
                "h-1.5 w-1.5 rounded-pill",
                isCompleted ? "bg-primary animate-pulse" : "bg-muted"
              )} />
            </span>

            {/* Content card */}
            <div className="bg-card border border-border hover:border-border-strong rounded-xl p-4.5 transition-all duration-slow shadow-xs hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden">
              {/* Dynamic spotlight hover background overlay */}
              <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-slow bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

              <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                      {visit.visitType?.replace("_", " ") ?? "Consultation"}
                    </span>
                    <span className="text-xs text-muted-foreground-2">·</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(new Date(visit.visitDate))}
                    </span>
                  </div>

                  {visit.chiefComplaint && (
                    <p className="mt-2 text-sm text-foreground font-medium leading-normal break-words">
                      {visit.chiefComplaint}
                    </p>
                  )}

                  {/* Vitals and details badges */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visit.vitals && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        <Heart className="w-3 h-3 text-danger" />
                        {visit.vitals.bp && `BP: ${visit.vitals.bp}`}
                        {visit.vitals.pulse && ` · PR: ${visit.vitals.pulse}`}
                      </span>
                    )}
                    {hasPrescription && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        <Stethoscope className="w-3 h-3 text-primary" />
                        {visit.prescription!.items.length} Remedy items
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                  {visit.improvementScore !== null && (
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight border",
                      visit.improvementScore >= 7
                        ? "bg-green-soft border-green-200 text-green"
                        : visit.improvementScore >= 4
                          ? "bg-warning-soft border-warning-200 text-warning"
                          : "bg-danger-soft border-danger-200 text-danger"
                    )}>
                      Score: {visit.improvementScore}/10
                    </span>
                  )}
                  <span className={cn(
                    "text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full",
                    visit.status === "completed"
                      ? "bg-green-soft text-green"
                      : visit.status === "locked"
                        ? "bg-neutral-soft text-muted-foreground"
                        : "bg-primary-soft text-primary"
                  )}>
                    {visit.status}
                  </span>
                </div>
              </div>

              {/* Show prescription list preview on hover with dynamic reveal */}
              {hasPrescription && (
                <div className="mt-3 pt-3 border-t border-border-subtle relative z-10 hidden group-hover:block transition-all duration-slow animate-in fade-in slide-in-from-top-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-1.5 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-muted-foreground-2" /> Prescribed Remedies
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {visit.prescription!.items.map((item) => (
                      <li key={item.id} className="text-xs text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{item.remedyName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
