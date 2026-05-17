export type Role = "admin" | "doctor" | "receptionist";

export interface AuthUser {
  id: string;
  clinicId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  role: Role;
  isActive: boolean;
  avatarUrl?: string | null;
}

export interface PatientListItem {
  id: string;
  patientCode: string;
  fullName: string;
  phone: string;
  gender?: string | null;
  dateOfBirth?: Date | null;
  caseType?: string | null;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  total?: number;
  error?: never;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    status: number;
    details?: unknown;
  };
  data?: never;
}
