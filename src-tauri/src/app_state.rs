use std::env;

use serde::{Deserialize, Serialize};

use crate::{config::AppConfig, filesystem};

#[derive(Serialize, Deserialize, Clone)]
pub struct AppState {
    pub config: AppConfig,
}

impl Default for AppState {
    fn default() -> Self {
        let data_dir_path = filesystem::DATA_DIR.clone();
        let data_dir = data_dir_path.display().to_string();
        let db_path = data_dir_path.join("database.db").display().to_string();
        let db_url = format!("sqlite:{}", db_path);

        let sync_interval_minutes = env::var("SYNC_INTERVAL_MINUTES")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(60);

        let ip_address = local_ip_address::local_ip()
            .map(|ip| ip.to_string())
            .unwrap_or_else(|_| "127.0.0.1".to_string());

        let config = AppConfig {
            db_path: db_path,
            db_url: db_url,
            data_dir: data_dir,
            sync_interval_minutes: sync_interval_minutes,
            ip_address: ip_address,
            port: 14200,
        };

        Self { config: config }
    }
}
