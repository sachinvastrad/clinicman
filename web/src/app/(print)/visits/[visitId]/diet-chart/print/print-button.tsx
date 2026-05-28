"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
    >
      Print / Save PDF
    </button>
  );
}
