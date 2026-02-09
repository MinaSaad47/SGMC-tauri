import { getAppConfig } from "@/lib/config/app";
import { info } from "@tauri-apps/plugin-log";
import Database from "@tauri-apps/plugin-sql";

let db: Database | undefined;

export async function getDb()
{
  if (!db)
  {
    const config = await getAppConfig();
    const url = config.db_url;
    info(`Loading database from ${url}`);
    db = await Database.load(url);
    info("Database loaded");
  }

  return db;
}