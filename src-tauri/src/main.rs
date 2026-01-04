// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tokio::main]
async fn main() {
    #[cfg(target_os = "linux")]
    fix_wayland_env();

    hospital_tauri_lib::run()
}

#[cfg(target_os = "linux")]
fn fix_wayland_env() {
    use std::env;
    use std::os::unix::process::CommandExt;
    use std::process::Command;

    // Prevent infinite restart loop
    if env::var("TAURI_WAYLAND_FIXED").is_ok() {
        return;
    }

    let is_wayland = env::var("XDG_SESSION_TYPE")
        .map(|v| v == "wayland")
        .unwrap_or(false)
        || env::var("WAYLAND_DISPLAY").is_ok();

    if !is_wayland {
        return;
    }

    let needs_fix = env::var("GDK_BACKEND").as_deref() != Ok("x11")
        || env::var("WEBKIT_DISABLE_COMPOSITING_MODE").as_deref() != Ok("1");

    if !needs_fix {
        return;
    }

    let exe = env::current_exe().expect("failed to get current exe");
    let args: Vec<String> = env::args().skip(1).collect();

    let error = Command::new(exe)
        .args(args)
        .env("GDK_BACKEND", "x11")
        .env("WEBKIT_DISABLE_COMPOSITING_MODE", "1")
        .env("TAURI_WAYLAND_FIXED", "1")
        .exec();

    panic!("Failed to restart process: {}", error);
}
