import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, calculateAge } from "@/lib/utils";
import { PrintButton } from "./print-button";

interface Props { params: Promise<{ visitId: string }> }

export default async function YogaPlanPrintPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) return null;

  const { visitId } = await params;

  const visit = await prisma.visit.findFirst({
    where: { id: visitId, clinicId: user.clinic_id },
    include: {
      patient: { select: { fullName: true, patientCode: true, dateOfBirth: true, gender: true, phone: true } },
      yogaPlan: {
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: {
              yogaAsana: {
                select: { name: true, sanskritName: true, category: true, description: true, benefits: true, imageUrl: true },
              },
            },
          },
        },
      },
      doctor: { select: { fullName: true } },
    },
  });

  if (!visit || !visit.yogaPlan) notFound();

  const clinic = await prisma.clinic.findFirst({
    where: { id: user.clinic_id },
    select: { name: true, address: true, phone: true, email: true },
  });

  const plan    = visit.yogaPlan;
  const patient = visit.patient;
  const age     = calculateAge(patient.dateOfBirth);
  const today   = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      {/* Import Sachi Premium Typography */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { size: A4; margin: 12mm 15mm; }
          .pose-img { max-width: 80px !important; max-height: 80px !important; }
        }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; }
        .print-sheet { font-family: 'Plus Jakarta Sans', sans-serif; background-color: white; }
        .display-font { font-family: 'Outfit', sans-serif; }
      `}</style>

      {/* Glassmorphic Print Toolbar */}
      <div className="no-print flex items-center justify-between px-8 py-3 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm transition-all duration-fast">
        <a 
          href={`/patients/${visit.patientId}/visits`} 
          className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1.5 transition-colors duration-fast"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Case History
        </a>
        <PrintButton />
      </div>

      {/* A4 Sheet Masterpiece */}
      <div className="print-sheet max-w-2xl mx-auto bg-white p-10 shadow-xl border border-gray-100 rounded-2xl print:shadow-none print:border-none print:p-0 print:max-w-none min-h-screen relative overflow-hidden my-8 print:my-0">
        
        {/* Subtle Botanical Clinic Crest Watermark (opacity 0.02) */}
        <div aria-hidden className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.025] select-none z-0">
          <svg className="w-[450px] h-[450px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </div>

        {/* Elegant Header Block */}
        <div className="relative z-10 flex items-center justify-between border-b-2 border-primary-soft/30 pb-6 mb-8 gap-6">
          <div className="flex items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt={clinic?.name ?? "Clinic"} className="h-16 w-auto object-contain shrink-0" />
            <div>
              <h1 className="display-font text-2xl font-extrabold text-teal-800 uppercase tracking-tight">{clinic?.name ?? "Sachi Homeopathic Clinic"}</h1>
              {clinic?.address && <p className="text-[12px] text-gray-500 font-medium mt-0.5 max-w-sm leading-snug">{clinic.address}</p>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] font-bold text-teal-700/80 uppercase tracking-widest">Sachi OS v2.2</p>
            <p className="text-[12px] text-gray-500 font-semibold mt-1">Tel: {clinic?.phone}</p>
            <p className="text-[11px] text-gray-400 font-medium">{clinic?.email}</p>
          </div>
        </div>

        {/* Action title bar */}
        <div className="relative z-10 flex items-center justify-between mb-6 gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-6 rounded-pill bg-gradient-brand inline-block" />
            <h2 className="display-font text-[17px] font-extrabold uppercase tracking-wider text-teal-900">Yoga Therapy Plan</h2>
          </div>
          <div className="text-right text-[12px] text-gray-500 font-medium">
            <p>Date: <span className="font-semibold text-gray-800">{formatDate(visit.visitDate)}</span></p>
            {visit.followUpDate && <p className="mt-0.5">Next Review: <span className="font-semibold text-teal-800">{formatDate(visit.followUpDate)}</span></p>}
          </div>
        </div>

        {/* Patient Profile Card (cohesive styling) */}
        <div className="relative z-10 grid grid-cols-2 gap-x-8 gap-y-2.5 text-[13px] mb-8 bg-teal-50/20 rounded-xl p-4 border border-teal-100/40">
          <div><span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Patient Name</span> <p className="font-semibold text-gray-900 mt-0.5">{patient.fullName}</p></div>
          <div><span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Patient Code</span> <p className="font-semibold text-gray-900 mt-0.5">{patient.patientCode}</p></div>
          <div>
            <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Age / Gender</span> 
            <p className="font-semibold text-gray-900 mt-0.5">
              {age !== null ? `${age} yrs` : "—"} / <span className="capitalize">{patient.gender || "—"}</span>
            </p>
          </div>
          {visit.diagnosis && (
            <div><span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Clinical Diagnosis</span> <p className="font-semibold text-teal-900 mt-0.5">{visit.diagnosis}</p></div>
          )}
        </div>

        {/* Asana table */}
        <div className="relative z-10 overflow-x-auto mb-8 border border-gray-100 rounded-xl shadow-sm">
          <table className="w-full text-[13px] border-collapse bg-white">
            <thead>
              <tr className="bg-teal-800 text-white display-font text-[11px] font-bold uppercase tracking-wider text-left border-b border-teal-900">
                <th className="py-3 px-4 w-6">#</th>
                <th className="py-3 px-3">Asana Pose</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Reps</th>
                <th className="py-3 px-4">Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plan.items.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-teal-50/10"}>
                  <td className="py-3 px-4 font-semibold text-gray-400 align-top">{idx + 1}.</td>
                  <td className="py-3 px-3 align-top">
                    <div className="flex items-start gap-3">
                      {item.yogaAsana.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.yogaAsana.imageUrl}
                          alt={item.yogaAsana.name}
                          className="pose-img w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0 shadow-sm"
                        />
                      )}
                      <div>
                        <p className="font-extrabold text-teal-900">{item.yogaAsana.name}</p>
                        {item.yogaAsana.sanskritName && (
                          <p className="text-[11px] text-teal-700/80 italic font-semibold">{item.yogaAsana.sanskritName}</p>
                        )}
                        {item.yogaAsana.category && (
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">{item.yogaAsana.category}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 align-top text-gray-700 font-semibold">{item.duration ?? item.yogaAsana.description?.slice(0, 20) ?? "—"}</td>
                  <td className="py-3 px-3 align-top text-gray-700 font-bold">{item.repetitions ?? "—"}</td>
                  <td className="py-3 px-4 align-top text-gray-600 font-medium leading-relaxed">{item.instructions ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Benefits summary list */}
        {plan.items.some((i) => i.yogaAsana.benefits) && (
          <div className="relative z-10 mb-6 text-[13px] p-4 bg-teal-50/10 border border-teal-100/30 rounded-xl">
            <p className="display-font font-bold text-teal-800 uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
              <span className="w-1 h-3 rounded-pill bg-teal-600 inline-block" />
              Targeted Asana Benefits
            </p>
            <ul className="space-y-1.5 text-gray-700 pl-1">
              {plan.items.filter((i) => i.yogaAsana.benefits).map((i) => (
                <li key={i.id} className="flex items-start gap-2">
                  <span className="text-teal-600 mt-1 shrink-0 font-extrabold">▪</span>
                  <span><span className="font-extrabold text-teal-950">{i.yogaAsana.name}:</span> {i.yogaAsana.benefits}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Practitioner Notes Box (Amber/Gold Accented) */}
        {plan.notes && (
          <div className="relative z-10 mb-8 p-4 bg-amber-50/70 border border-amber-200/50 rounded-xl text-[13px] relative overflow-hidden">
            {/* Subtle amber icon back */}
            <div className="absolute top-1 right-2 opacity-5 text-amber-600">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="display-font font-bold text-amber-800 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
              <span className="w-1 h-3 rounded-pill bg-amber-600 inline-block" />
              Practitioner Therapy Guidelines
            </p>
            <p className="text-amber-900/90 whitespace-pre-line leading-relaxed font-semibold">{plan.notes}</p>
          </div>
        )}

        {/* Signature & System authenticated details */}
        <div className="relative z-10 mt-14 flex justify-between items-end text-[13px]">
          <div>
            <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">System Authenticated</p>
            <p className="text-[11px] text-gray-500 font-medium mt-1">Generated: {today}</p>
          </div>
          <div className="text-right">
            <div className="border-t border-teal-700/30 pt-3 mt-6 min-w-56">
              <p className="display-font font-extrabold text-teal-800">{visit.doctor?.fullName ?? "Dr Rachana Vastrad BHMS"}</p>
              <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider mt-0.5">Homeopathic Physician</p>
              <p className="text-gray-400 text-[10px] font-semibold">{clinic?.name}</p>
            </div>
          </div>
        </div>

        {/* Elegant computer-generated notification note */}
        <div className="relative z-10 mt-10 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
          Practice on an empty stomach in the morning. Consult your physician immediately if discomfort occurs.
        </div>
      </div>
    </>
  );
}
