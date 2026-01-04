use crate::{database::get_db_plugin, logging::get_logging_plugin};
use log;

mod database;
mod filesystem;
mod logging;

#[tauri::command]
fn db_url() -> String {
    database::DB_URL.clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    log::info!("Starting application...");
    log::info!("Database URL: {}", database::DB_URL.as_str());

    tauri::Builder::default()
        .plugin(get_logging_plugin())
        .plugin(get_db_plugin())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![db_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
