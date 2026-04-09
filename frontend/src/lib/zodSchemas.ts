import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registrationRequestSchema = z.object({
  fullName: z.string().min(1),
  phoneNumber: z.string().min(1),
  email: z.string().email().regex(/@gmail\.com$/i, "Please provide a Gmail address"),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  role: z.enum(["TENANT", "CARETAKER", "OWNER"]),
  estateOfInterest: z.string().optional(),
  message: z.string().optional(),
}).refine((value) => value.password === value.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const createEstateSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  owner_user_id: z.string().uuid(),
});

export const createManagedUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "OWNER", "CARETAKER", "TENANT"]),
});

export const createUnitSchema = z.object({
  unit_number: z.string().min(1),
  estate_id: z.string().uuid(),
  monthly_rent: z.coerce.number().min(0),
  description: z.string().optional(),
});

export const createComplaintSchema = z.object({
  estate_id: z.string().uuid(),
  subject: z.string().min(1),
  description: z.string().min(1),
  is_deductible: z.boolean().optional(),
  tenant_id: z.string().uuid().optional(),
});

export const caretakerReviewComplaintSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  estimated_cost: z.coerce.number().min(0).optional(),
});

export const ownerReviewComplaintSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  final_cost: z.coerce.number().min(0).optional(),
});

export const monthlyReportQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});
