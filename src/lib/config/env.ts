import { message } from "@tauri-apps/plugin-dialog";
import { exit } from "@tauri-apps/plugin-process";
import { z } from "zod";

const envSchema = z.object({
  VITE_GOOGLE_CLIENT_ID: z.string().min(1, "VITE_GOOGLE_CLIENT_ID is required"),
  VITE_GOOGLE_CLIENT_SECRET: z.string().min(1, "VITE_GOOGLE_CLIENT_SECRET is required"),
});


const configResult = envSchema.safeParse(import.meta.env);

if (!configResult.success)
{
  await message(`Missing environment variables: ${configResult.error.message}`, {
    kind: "error",
    buttons: "Ok",
    title: "Error",
  });
  exit(1);
}

export const env = configResult.data;