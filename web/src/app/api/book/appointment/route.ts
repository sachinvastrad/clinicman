import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, appointmentDate, appointmentTime } = body ?? {};

    // ── Validation ──────────────────────────────────────────────────────────
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Name is required (min 2 characters)." }, { status: 400 });
    }
    if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
      return NextResponse.json({ error: "Valid phone number is required." }, { status: 400 });
    }
    if (!appointmentDate || typeof appointmentDate !== "string") {
      return NextResponse.json({ error: "appointmentDate (YYYY-MM-DD) is required." }, { status: 400 });
    }
    if (!appointmentTime || typeof appointmentTime !== "string" || !/^\d{2}:\d{2}$/.test(appointmentTime)) {
      return NextResponse.json({ error: "appointmentTime (HH:MM) is required." }, { status: 400 });
    }

    const testDate = new Date(appointmentDate);
    if (isNaN(testDate.getTime())) {
      return NextResponse.json({ error: "Invalid appointmentDate." }, { status: 400 });
    }

    // ── Find clinic ──────────────────────────────────────────────────────────
    const clinic = await prisma.clinic.findFirst();
    if (!clinic) {
      return NextResponse.json({ error: "No clinic configured." }, { status: 500 });
    }

    // ── Find or create patient ───────────────────────────────────────────────
    let patient = await prisma.patient.findFirst({
      where: { clinicId: clinic.id, phone: phone.trim() },
    });

    if (!patient) {
      const count = await prisma.patient.count({ where: { clinicId: clinic.id } });
      const year  = new Date().getFullYear();
      const patientCode = `DRM-${year}-${String(count + 1).padStart(5, "0")}`;

      patient = await prisma.patient.create({
        data: {
          clinicId:    clinic.id,
          patientCode,
          fullName:    name.trim(),
          phone:       phone.trim(),
          email:       email?.trim() || null,
          whatsappOptin: false,
        },
      });
    }

    // ── Find doctor ──────────────────────────────────────────────────────────
    let doctor = await prisma.user.findFirst({
      where: { clinicId: clinic.id, role: "doctor", isActive: true },
    });
    if (!doctor) {
      doctor = await prisma.user.findFirst({
        where: { clinicId: clinic.id, isActive: true },
      });
    }

    // ── Build scheduledAt from date + time ───────────────────────────────────
    const [hours, minutes] = appointmentTime.split(":").map(Number);
    const scheduledAt = new Date(appointmentDate);
    scheduledAt.setUTCHours(hours, minutes, 0, 0);

    // ── Create appointment ───────────────────────────────────────────────────
    const appointment = await prisma.appointment.create({
      data: {
        clinicId:        clinic.id,
        patientId:       patient.id,
        doctorId:        doctor?.id ?? null,
        scheduledAt,
        appointmentType: "consultation",
        status:          "scheduled",
        notes:           "Booked via online portal",
        createdBy:       doctor?.id ?? null,
      },
    });

    return NextResponse.json({
      data: {
        appointmentId: appointment.id,
        patientCode:   patient.patientCode,
      },
    }, { status: 201 });

  } catch (err) {
    console.error("[book/appointment] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
