"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/shared/header";
import { UserPlus, Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface StaffMember {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const addUserSchema = z.object({
  fullName: z.string().min(2, "Name required"),
  phone:    z.string().regex(/^\+91[6-9]\d{9}$/, "Enter valid Indian mobile with +91"),
  email:    z.string().email().optional().or(z.literal("")),
  role:     z.enum(["doctor", "receptionist", "admin"]),
});
type AddUserInput = z.infer<typeof addUserSchema>;

export default function StaffPage() {
  const [staff, setStaff]   = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AddUserInput>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { role: "doctor" },
  });

  async function loadStaff() {
    const res = await fetch("/api/users");
    const json = await res.json();
    setStaff(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadStaff(); }, []);

  async function onSubmit(data: AddUserInput) {
    setServerError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, email: data.email || undefined }),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error?.message ?? "Failed to add staff"); return; }
    setSuccessMsg(`${data.fullName} added successfully`);
    reset();
    setShowForm(false);
    loadStaff();
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    loadStaff();
  }

  const roleColor: Record<string, string> = {
    admin:        "bg-purple-100 text-purple-700",
    doctor:       "bg-blue-100 text-blue-700",
    receptionist: "bg-teal-100 text-teal-700",
  };

  return (
    <>
      <Header title="Staff Management" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/settings" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-semibold">Staff Management</h2>
              <p className="text-sm text-muted-foreground">Manage clinic team members and roles</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <UserPlus className="w-4 h-4" /> Add Staff
          </button>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            <CheckCircle className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {showForm && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-medium mb-4">Add New Staff Member</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Full Name *</label>
                  <input {...register("fullName")} className={cls(!!errors.fullName)} placeholder="Dr. Ranjit Sharma" />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Phone *</label>
                  <input {...register("phone")} placeholder="+919876543210" className={cls(!!errors.phone)} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Email</label>
                  <input {...register("email")} type="email" className={cls(false)} placeholder="optional" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Role *</label>
                  <select {...register("role")} className={cls(false)}>
                    <option value="doctor">Doctor</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {serverError && <p className="text-sm text-destructive">{serverError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {isSubmitting ? "Adding…" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Staff Member</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.fullName}</p>
                      {s.email && <p className="text-xs text-muted-foreground">{s.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColor[s.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-xs ${s.isActive ? "text-green-600" : "text-muted-foreground"}`}>
                        {s.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleActive(s.id, s.isActive)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        {s.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {staff.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No staff members yet</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function cls(hasError: boolean) {
  return `w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors ${
    hasError ? "border-destructive" : "border-input focus:border-ring"
  } focus:ring-2 focus:ring-ring/20`;
}
