"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DashboardSkeleton() {
  return (
    <div className="relative flex-1 overflow-hidden p-8 space-y-6">
      {/* Bento Skeleton Grid */}
      <div className="grid grid-cols-12 gap-6 items-start animate-pulse">
        
        {/* Left Bento Column (Spans 8 columns) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Hero Greeting Shimmer Shape */}
          <div className="flex items-center justify-between bg-card-elevated/10 p-8 rounded-2xl border border-border/20 backdrop-blur-sm h-48 relative overflow-hidden">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-4 w-32 rounded bg-muted skeleton-shimmer" />
              <Skeleton className="h-8 w-64 rounded bg-muted skeleton-shimmer" />
              <Skeleton className="h-4 w-96 rounded bg-muted skeleton-shimmer" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-28 rounded-md bg-muted skeleton-shimmer" />
              <Skeleton className="h-9 w-24 rounded-md bg-muted skeleton-shimmer" />
            </div>
          </div>

          {/* Asymmetrical KPI layout cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "bg-card border border-border/40 p-5 rounded-xl flex flex-col gap-4 h-36 relative overflow-hidden",
                  i === 1 && "sm:col-span-2 md:col-span-1"
                )}
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-10 w-10 rounded-lg bg-muted skeleton-shimmer" />
                  <Skeleton className="h-4 w-4 rounded bg-muted skeleton-shimmer" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-7 w-20 rounded bg-muted skeleton-shimmer" />
                  <Skeleton className="h-4 w-32 rounded bg-muted skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Bento Column (Spans 4 columns) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Featured Consultation Desk shape */}
          <div className="bg-card border border-border/40 p-6 rounded-2xl h-44 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded bg-muted skeleton-shimmer" />
              <Skeleton className="h-3 w-48 rounded bg-muted skeleton-shimmer" />
            </div>
            <Skeleton className="h-9 w-full rounded-md bg-muted skeleton-shimmer" />
          </div>

          {/* Action grid wrapper shape */}
          <div className="bg-card border border-border/40 p-6 rounded-2xl h-56 relative overflow-hidden flex flex-col gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded bg-muted skeleton-shimmer" />
              <Skeleton className="h-3 w-40 rounded bg-muted skeleton-shimmer" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 rounded bg-muted skeleton-shimmer" />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
