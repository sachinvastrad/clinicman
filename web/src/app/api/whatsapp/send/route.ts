import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sendSchema = z.object({
  patientId:    z.string().uuid(),
  templateName: z.string().optional().nullable(),
  messageBody:  z.string().optional().nullable(),
}).refine((d) => d.templateName || d.messageBody, {
  message: "Either templateName or messageBody is required",
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400 } }, { status: 400 });
  }

  const patient = await prisma.patient.findFirst({ where: { id: parsed.data.patientId, clinicId: user.clinic_id } });
  if (!patient) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Patient not found", status: 404 } }, { status: 404 });

  if (!patient.whatsappOptin) {
    return NextResponse.json({ error: { code: "OPT_OUT", message: "Patient has not opted in for WhatsApp messages.", status: 403 } }, { status: 403 });
  }

  // Log the message — actual WATI sending would happen here
  const message = await prisma.whatsappMessage.create({
    data: {
      clinicId:     user.clinic_id,
      patientId:    patient.id,
      direction:    "outbound",
      templateName: parsed.data.templateName ?? null,
      messageBody:  parsed.data.messageBody ?? null,
      status:       "queued",
      sentBy:       user.id,
    },
  });

  // TODO: Call WATI API to actually send the message (Sprint 5)

  return NextResponse.json({ data: message }, { status: 201 });
}
