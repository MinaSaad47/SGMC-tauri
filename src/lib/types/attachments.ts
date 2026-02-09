import { z } from "zod";

export interface Attachment {
  id: string;
  statementId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: number;
}

export const AddAttachmentSchema = z.object({
  statementId: z.string().uuid(),
  fileName: z.string().min(1),
  fileType: z.string(),
  fileData: z.string(), // Base64 string
});

export type AddAttachmentSchema = z.infer<typeof AddAttachmentSchema>;