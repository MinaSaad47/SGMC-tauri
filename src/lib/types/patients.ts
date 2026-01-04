import { z } from "zod";

export interface Patient {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export const AddPatientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
});
export type AddPatientSchema = z.infer<typeof AddPatientSchema>;

export const UpdatePatientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
});
export type UpdatePatientSchema = z.infer<typeof UpdatePatientSchema>;

export interface PatientDetails extends Patient {
  statementCount: number;
  overdueCount: number;

  totalRequired: number;
  totalPaid: number;
  totalRemaining: number;
}
