import { z } from "zod";
import { Patient } from "./patients";
import { Session } from "./sessions";
import { Payment } from "./payments";

export interface Statement {
  id: string;
  patient: Patient;

  total: number;
  totalPaid: number;
  totalRemaining: number;

  createdAt: Date;
  updatedAt: Date;
}

export const AddStatementSchema = z.object({
  patientId: z.string().uuid(),
  total: z.number().min(1),
});
export type AddStatementSchema = z.infer<typeof AddStatementSchema>;

export const UpdateStatementSchema = z.object({
  total: z.number().min(1),
});
export type UpdateStatementSchema = z.infer<typeof UpdateStatementSchema>;

export interface StatementDetails extends Statement {
  sessions: Session[];
  payments: Payment[];
}
