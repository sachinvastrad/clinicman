"use client";

import { Header } from "@/components/shared/header";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User2, Phone, Mail, Calendar, Edit2, Check, X, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_OPTIONS = ["new", "contacted", "interested", "not_interested", "converted", "lost"] as const;

const statusColor: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  interested: "bg-teal-100 text-teal-700",
  converted: "bg-green-100 text-green-700",
  not_interested: "bg-gray-100 text-gray-600",
  lost: "bg-red-100 text-red-700",
};

interface Lead {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  source?: string;
  status: string;
  interestedIn?: string;
  notes?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [convertError, setConvertError] = useState("");
  const [form, setForm] = useState<Partial<Lead>>({});

  useEffect(() => {
    fetch(`/api/leads/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setLead(d.data);
        setForm(d.data);
        setLoading(false);
      });
  }, [params.id]);

  async function save() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/leads/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { setSaveError(d.error?.message ?? "Save failed"); setSaving(false); return; }
      setLead(d.data);
      setForm(d.data);
      setEditing(false);
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function convert() {
    if (!confirm("Convert this lead to a patient?")) return;
    setConverting(true);
    setConvertError("");
    try {
      const res = await fetch(`/api/leads/${params.id}/convert`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const d = await res.json();
      if (d.data?.id) {
        router.push(`/patients/${d.data.id}`);
      } else {
        setConvertError(d.error?.message ?? "Conversion failed");
      }
    } catch {
      setConvertError("Network error. Please try again.");
    } finally {
      setConverting(false);
    }
  }

  if (loading) return <><Header title="Lead" /><div className="p-6 text-muted-foreground">Loading…</div></>;
  if (!lead) return <><Header title="Lead" /><div className="p-6 text-muted-foreground">Lead not found.</div></>;

  return (
    <>
      <Header title={lead.fullName} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
        {/* Back + actions */}
        <div className="flex items-center justify-between gap-4">
          <Link href="/leads" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex gap-2">
            {lead.status !== "converted" && (
              <button
                onClick={convert}
                disabled={converting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                {converting ? "Converting…" : "Convert to Patient"}
              </button>
            )}
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            ) : (
              <>
                <button onClick={save} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  <Check className="w-4 h-4" />{saving ? "Saving…" : "Save"}
                </button>
                <button onClick={() => { setEditing(false); setForm(lead); }}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
                  <X className="w-4 h-4" /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {saveError && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{saveError}</div>
        )}
        {convertError && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{convertError}</div>
        )}

        {/* Status badge */}
        <div className="flex items-center gap-3">
          {editing ? (
            <select
              value={form.status ?? lead.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          ) : (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[lead.status] ?? "bg-gray-100 text-gray-600"}`}>
              {lead.status.replace("_", " ")}
            </span>
          )}
          <span className="text-xs text-muted-foreground">Added {formatDate(lead.createdAt)}</span>
        </div>

        {/* Detail card */}
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {/* Name */}
          <div className="flex items-center gap-3 px-5 py-4">
            <User2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">Name</p>
              {editing ? (
                <input value={form.fullName ?? ""} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full text-sm bg-muted/50 rounded px-2 py-1 border border-input" />
              ) : (
                <p className="text-sm font-medium">{lead.fullName}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3 px-5 py-4">
            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
              {editing ? (
                <input value={form.phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full text-sm bg-muted/50 rounded px-2 py-1 border border-input" />
              ) : (
                <p className="text-sm">{lead.phone}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 px-5 py-4">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">Email</p>
              {editing ? (
                <input value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full text-sm bg-muted/50 rounded px-2 py-1 border border-input" />
              ) : (
                <p className="text-sm">{lead.email ?? "—"}</p>
              )}
            </div>
          </div>

          {/* Interested In */}
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-4 h-4 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">Interested In</p>
              {editing ? (
                <input value={form.interestedIn ?? ""} onChange={(e) => setForm((f) => ({ ...f, interestedIn: e.target.value }))}
                  placeholder="e.g. Homeopathy, Weight Management"
                  className="w-full text-sm bg-muted/50 rounded px-2 py-1 border border-input" />
              ) : (
                <p className="text-sm">{lead.interestedIn ?? "—"}</p>
              )}
            </div>
          </div>

          {/* Follow-up date */}
          <div className="flex items-center gap-3 px-5 py-4">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">Follow-up Date</p>
              {editing ? (
                <input type="date" value={form.followUpDate ? new Date(form.followUpDate).toISOString().slice(0, 10) : ""}
                  onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))}
                  className="text-sm bg-muted/50 rounded px-2 py-1 border border-input" />
              ) : (
                <p className="text-sm">{lead.followUpDate ? formatDate(lead.followUpDate) : "—"}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground mb-1.5">Notes</p>
            {editing ? (
              <textarea
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full text-sm bg-muted/50 rounded px-2 py-1.5 border border-input resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-line">{lead.notes ?? "—"}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
