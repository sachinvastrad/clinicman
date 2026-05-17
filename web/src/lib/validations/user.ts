import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(2, "Name required"),
  phone:    z.string().regex(/^\+?[0-9]{10,13}$/, "Valid phone required"),
  email:    z.string().email("Valid email required").optional().or(z.literal("")),
  role:     z.enum(["doctor", "receptionist", "admin"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,13}$/, "Enter a valid phone number"),
});

export const verifyOtpSchema = z.object({
  phone: z.string(),
  otp:   z.string().length(6, "OTP must be 6 digits"),
});
