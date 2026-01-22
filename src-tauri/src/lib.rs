use crate::{database::get_db_plugin, logging::get_logging_plugin};
use log;
use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;

mod database;
mod filesystem;
mod logging;

#[tauri::command]
fn get_db_url() -> String {
    database::DB_URL.clone()
}

#[tauri::command]
fn get_db_path() -> String {
    database::DB_PATH.clone()
}

#[tauri::command]
fn get_sync_interval_minutes() -> u64 {
    std::env::var("SYNC_INTERVAL_MINUTES")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(60)
}

#[tauri::command]
async fn start_oauth_server(port: u16) -> Result<String, String> {
    let listener = TcpListener::bind(format!("127.0.0.1:{}", port))
        .map_err(|e| format!("Failed to bind to port {}: {}", port, e))?;

    // Accept only one connection (the redirect)
    if let Ok((mut stream, _)) = listener.accept() {
        let mut reader = BufReader::new(&stream);
        let mut request_line = String::new();
        reader
            .read_line(&mut request_line)
            .map_err(|e| e.to_string())?;

        // Extract the code from the GET request "GET /?code=... HTTP/1.1"
        // Simple string parsing to avoid deps
        let url_part = request_line
            .split_whitespace()
            .nth(1)
            .ok_or("Invalid request")?;

        // Parse the code param
        // URL is like: /?state=...&code=4/0A...&scope=...
        let code = url_part
            .split('&')
            .find(|part| part.starts_with("code=") || part.contains("?code="))
            .and_then(|part| part.split('=').nth(1))
            .ok_or("No code found in request")?
            .to_string();

        // Send a nice HTML response to the browser
        let response = "HTTP/1.1 200 OK\r\n\r\n<html><body><h1>Login Successful!</h1><p>You can close this window and return to the application.</p><script>window.close()</script></body></html>";
        stream
            .write_all(response.as_bytes())
            .map_err(|e| e.to_string())?;

        return Ok(code);
    }

    Err("Server stopped without receiving code".to_string())
}

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
            get_db_url,
            get_db_path,
            start_oauth_server,
            get_sync_interval_minutes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
