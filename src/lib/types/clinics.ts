import { z } from "zod";

export const ClinicSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const AddClinicSchema = ClinicSchema.pick({
  name: true,
});

export const UpdateClinicSchema = ClinicSchema.pick({
  name: true,
});

export type Clinic = z.infer<typeof ClinicSchema>;
export type AddClinicSchema = z.infer<typeof AddClinicSchema>;
export type UpdateClinicSchema = z.infer<typeof UpdateClinicSchema>;
