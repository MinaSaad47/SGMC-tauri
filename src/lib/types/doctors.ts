import { z } from "zod";

export const DoctorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const AddDoctorSchema = DoctorSchema.pick({
  name: true,
  phone: true,
});

export const UpdateDoctorSchema = DoctorSchema.pick({
  name: true,
  phone: true,
});

export type Doctor = z.infer<typeof DoctorSchema>;
export type AddDoctorSchema = z.infer<typeof AddDoctorSchema>;
export type UpdateDoctorSchema = z.infer<typeof UpdateDoctorSchema>;
