import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/shared/header";
import { MedicalCertificateForm } from "./medical-certificate-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MedicalCertificatePage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;

  const [patient, clinic] = await Promise.all([
    prisma.patient.findFirst({
      where: { id, clinicId: user.clinic_id },
      select: {
        id: true,
        fullName: true,
        patientCode: true,
        dateOfBirth: true,
        gender: true,
        phone: true,
      },
    }),
    prisma.clinic.findFirst({
      where: { id: user.clinic_id },
      select: { name: true, address: true, phone: true },
    }),
  ]);

  if (!patient) notFound();

  const doctorName = user.full_name ?? "Dr. Attending Physician";

  return (
    <>
      <Header title="Medical Certificate" />
      <MedicalCertificateForm
        patient={{
          id: patient.id,
          fullName: patient.fullName,
          patientCode: patient.patientCode,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          phone: patient.phone,
        }}
        clinic={{
          name: clinic?.name ?? "DrMan Clinic",
          address: clinic?.address ?? null,
          phone: clinic?.phone ?? null,
        }}
        doctorName={doctorName}
      />
    </>
  );
}
