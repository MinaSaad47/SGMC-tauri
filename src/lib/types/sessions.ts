import z from "zod";
import { StatementDetails } from "./statements";

export interface Session {
  id: string;
  procedure: string;

  createdAt: Date;
  updatedAt: Date;
}

export const AddSessionSchema = z.object({
  statementId: z.uuid(),
  procedure: z.string().min(1),
});

export type AddSessionSchema = z.infer<typeof AddSessionSchema>;

export const UpdateSessionSchema = z.object({
  procedure: z.string().min(1),
});

export type UpdateSessionSchema = z.infer<typeof UpdateSessionSchema>;

export interface SessionDetails extends Session {
  statement: StatementDetails;
}
