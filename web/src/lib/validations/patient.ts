import { z } from "zod";

export const createPatientSchema = z.object({
  fullName:      z.string().min(2, "Name must be at least 2 characters"),
  phone:         z.string().regex(/^\+?[0-9]{10,13}$/, "Enter a valid phone number"),
  email:         z.string().email("Enter a valid email").optional().or(z.literal("")),
  dateOfBirth:   z.string().optional(),
  gender:        z.enum(["male", "female", "other"]).optional(),
  address:       z.string().optional(),
  occupation:    z.string().optional(),
  referredBy:    z.string().optional(),
  allergies:     z.string().optional(),
  caseType:      z.enum(["chronic", "acute", "new"]).default("new"),
  whatsappOptin: z.boolean().default(true),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema.partial();
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
