import { z } from "zod";
import { Patient } from "./patients";
import { Session } from "./sessions";
import { Payment } from "./payments";
import { Doctor } from "./doctors";
import { Clinic } from "./clinics";
import { Attachment } from "./attachments";

export interface Statement {
  id: string;
  patient: Patient;
  doctor?: Doctor;
  clinic?: Clinic;

  total: number;
  totalPaid: number;
  totalRemaining: number;

  createdAt: Date;
  updatedAt: Date;
}

export const AddStatementSchema = z.object({
  patientId: z.string().uuid(),
  total: z.number().min(1),
  doctorId: z.string().uuid().optional(),
  clinicId: z.string().uuid().optional(),
});
export type AddStatementSchema = z.infer<typeof AddStatementSchema>;

export const UpdateStatementSchema = z.object({
  total: z.number().min(1),
  doctorId: z.string().uuid().optional().nullable(), // Nullable to allow clearing
  clinicId: z.string().uuid().optional().nullable(),
});
export type UpdateStatementSchema = z.infer<typeof UpdateStatementSchema>;

export interface StatementDetails extends Statement {
  sessions: Session[];
  payments: Payment[];
  attachments: Attachment[];
}