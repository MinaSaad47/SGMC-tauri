use log;
use tauri::Manager;

use crate::app_state::AppState;

mod app_state;
mod config;
mod database;
mod filesystem;
mod logging;
mod server;



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    log::info!("Starting application...");


    let app_state = AppState::default();


    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(logging::get_logging_plugin())
        .plugin(database::get_db_plugin(&app_state.config.db_url))
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .setup(|app| {
            let handle = app.handle().clone();
            let config = handle.state::<AppState>().config.clone();
            log::info!("{:#?}", &config);
            tauri::async_runtime::spawn(async move {
                let _ = server::start_server(handle).await;
                log::info!("Scanner/OAuth server started on port {}", config.port);
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            config::get_app_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}