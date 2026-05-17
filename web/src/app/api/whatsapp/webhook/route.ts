import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// WATI webhook — receives incoming messages and delivery status updates
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-wati-secret");
  if (secret !== process.env.WATI_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Handle delivery status updates
  if (body.type === "status_update" && body.messageId) {
    await prisma.whatsappMessage.updateMany({
      where:  { watiMessageId: body.messageId },
      data:   {
        status:      body.status ?? "sent",
        deliveredAt: body.status === "delivered" ? new Date() : undefined,
        readAt:      body.status === "read" ? new Date() : undefined,
      },
    });
  }

  // Handle inbound messages — log them
  if (body.type === "message" && body.waId) {
    const patient = await prisma.patient.findFirst({ where: { phone: `+${body.waId}` } });
    if (patient) {
      await prisma.whatsappMessage.create({
        data: {
          clinicId:    patient.clinicId,
          patientId:   patient.id,
          direction:   "inbound",
          messageBody: body.text?.body ?? null,
          status:      "delivered",
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
