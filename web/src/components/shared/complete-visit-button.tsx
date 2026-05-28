"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  visitId: string;
  status: string;
}

export function CompleteVisitButton({ visitId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status === "completed" || status === "locked") return null;

  async function complete() {
    if (!confirm("Mark this visit as completed?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const d = await res.json();
        alert(d.error?.message ?? "Failed to complete visit");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={complete}
      disabled={loading}
      className="flex items-center gap-1 justify-end text-xs text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 transition-colors"
      title="Mark visit as completed"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
      Complete Visit
    </button>
  );
}
