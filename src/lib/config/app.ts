import { invoke } from "@tauri-apps/api/core";


interface AppConfig
{
    ip_address: string;
    port: number;
    data_dir: string;
    db_url: string;
    sync_interval_minutes: number;

}


let config: AppConfig | null = null;

export async function getAppConfig(): Promise<AppConfig>
{
    if (!config)
    {
        config = await invoke<AppConfig>("get_app_config");
    }
    return config;
}