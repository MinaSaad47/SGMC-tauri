use crate::{database::get_db_plugin, logging::get_logging_plugin};
use log;

mod config;
mod database;
mod filesystem;
mod logging;
mod oauth;



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    log::info!("Starting application...");
    log::info!("Database URL: {}", database::DB_URL.as_str());

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(get_logging_plugin())
        .plugin(get_db_plugin())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            database::get_db_url,
            database::get_db_path,
            oauth::start_oauth_server,
            config::get_sync_interval_minutes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
