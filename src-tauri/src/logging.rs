use tauri::{self, plugin::TauriPlugin};

pub fn get_logging_plugin<R>() -> TauriPlugin<R>
where
    R: tauri::Runtime,
{
    tauri_plugin_log::Builder::default()
        .level(log::LevelFilter::Info)
        .clear_targets()
        .target(tauri_plugin_log::Target::new(
            tauri_plugin_log::TargetKind::Stdout,
        ))
        .build()
}
