import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatDate, calculateAge } from "@/lib/utils";
import Link from "next/link";
import { UserPlus, Search, Phone, Calendar, Users } from "lucide-react";

interface Props {
  searchParams: Promise<{ q?: string; page?: string; caseType?: string }>;
}

export default async function PatientsPage({ searchParams }: Props) {
  const user   = await getSessionUser();
  if (!user) return null;

  const params   = await searchParams;
  const query    = params.q ?? "";
  const page     = Math.max(1, Number(params.page ?? 1));
  const pageSize = 20;

  const where = {
    clinicId: user.clinic_id,
    ...(query && {
      OR: [
        { fullName:   { contains: query } },
        { phone:      { contains: query } },
        { patientCode:{ contains: query } },
      ],
    }),
    ...(params.caseType && { caseType: params.caseType as never }),
  };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.patient.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <Header title="Patients" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <form className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by name, phone, ID…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring"
            />
          </form>
          <Link
            href="/patients/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" /> New Patient
          </Link>
        </div>

        {/* Stats bar */}
        <p className="text-sm text-muted-foreground">
          {query ? `${total} result${total !== 1 ? "s" : ""} for "${query}"` : `${total} patient${total !== 1 ? "s" : ""} registered`}
        </p>

        {/* Table */}
        {patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No patients found</p>
            {!query && (
              <Link href="/patients/new" className="mt-4 text-sm text-primary hover:underline">
                Register your first patient
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Age / Gender</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Case Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/patients/${p.id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                          {p.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium group-hover:text-primary transition-colors">{p.fullName}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.patientCode}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {p.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {calculateAge(p.dateOfBirth) ?? "—"} {p.gender ? `/ ${p.gender}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      {p.caseType && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.caseType === "chronic" ? "bg-orange-100 text-orange-700"
                          : p.caseType === "acute"   ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                        }`}>
                          {p.caseType}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(p.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/patients?q=${query}&page=${page - 1}`}
                  className="px-3 py-1.5 border border-border rounded-md hover:bg-muted transition-colors">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/patients?q=${query}&page=${page + 1}`}
                  className="px-3 py-1.5 border border-border rounded-md hover:bg-muted transition-colors">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
