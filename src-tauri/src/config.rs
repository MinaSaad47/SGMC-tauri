use serde::{Deserialize, Serialize};
use tauri::State;

use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub db_path: String,
    pub db_url: String,
    pub data_dir: String,
    pub sync_interval_minutes: u32,
    pub ip_address: String,
    pub port: u16,
}

#[tauri::command]
pub fn get_app_config(state: State<'_, AppState>) -> AppConfig {
    let mut config = state.config.clone();

    // Dynamically update IP address if possible
    if let Ok(ip) = local_ip_address::local_ip() {
        config.ip_address = ip.to_string();
    }

    config
}
