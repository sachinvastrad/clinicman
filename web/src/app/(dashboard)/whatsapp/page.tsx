import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";

export default async function WhatsAppPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const messages = await prisma.whatsappMessage.findMany({
    where:   { clinicId: user.clinic_id },
    orderBy: { createdAt: "desc" },
    take:    50,
    include: { patient: { select: { fullName: true, phone: true } } },
  });

  const statusColor: Record<string, string> = {
    queued:    "bg-gray-100 text-gray-600",
    sent:      "bg-blue-100 text-blue-700",
    delivered: "bg-teal-100 text-teal-700",
    read:      "bg-green-100 text-green-700",
    failed:    "bg-red-100 text-red-700",
  };

  return (
    <>
      <Header title="WhatsApp" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">WhatsApp Messages</h2>
            <p className="text-sm text-muted-foreground">Automated reminders and communications</p>
          </div>
          <Link href="/whatsapp/send"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Send className="w-4 h-4" /> Send Message
          </Link>
        </div>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">No messages sent yet</p>
            <p className="text-sm text-muted-foreground mt-1">Appointment reminders will appear here automatically</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Template</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Direction</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/patients/${msg.patientId}`} className="font-medium hover:text-primary transition-colors">
                        {msg.patient?.fullName ?? "Unknown patient"}
                      </Link>
                      <p className="text-xs text-muted-foreground">{msg.patient?.phone ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{msg.templateName ?? "Custom"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${msg.direction === "outbound" ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-600"}`}>
                        {msg.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[msg.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(msg.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
