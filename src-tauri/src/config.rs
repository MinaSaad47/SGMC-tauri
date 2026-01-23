/// Configuration-related Tauri commands

/// Get the sync interval in minutes from environment variables
#[tauri::command]
pub fn get_sync_interval_minutes() -> u64 {
    std::env::var("SYNC_INTERVAL_MINUTES")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(60)
}
