import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatCurrency(amount: number | string | any): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function generatePatientCode(clinicPrefix: string, sequence: number): string {
  return `${clinicPrefix}-${new Date().getFullYear()}-${String(sequence).padStart(5, "0")}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function calculateAge(dateOfBirth: Date | string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
