import z from "zod";
import { StatementDetails } from "./statements";

export interface Payment {
  id: string;
  amount: number;

  createdAt: Date;
  updatedAt: Date;
}

export const AddPaymentSchema = z.object({
  statementId: z.string().uuid(),
  amount: z.number().min(1),
});

export type AddPaymentSchema = z.infer<typeof AddPaymentSchema>;

export const UpdatePaymentSchema = z.object({
  amount: z.number().min(1),
});

export type UpdatePaymentSchema = z.infer<typeof UpdatePaymentSchema>;

export interface PaymentDetails extends Payment {
  statement: StatementDetails;
}
