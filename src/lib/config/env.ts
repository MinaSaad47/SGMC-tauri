import { z } from "zod";

const envSchema = z.object({
  VITE_GOOGLE_CLIENT_ID: z.string().min(1, "VITE_GOOGLE_CLIENT_ID is required"),
  VITE_GOOGLE_CLIENT_SECRET: z.string().min(1, "VITE_GOOGLE_CLIENT_SECRET is required"),
});

export const env = envSchema.parse(import.meta.env);
