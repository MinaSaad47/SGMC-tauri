use std::{env, fs, path::PathBuf, sync::LazyLock};

fn exe_dir() -> PathBuf {
    // AppImage (real location, not /tmp mount)
    if let Ok(appimage) = env::var("APPIMAGE") {
        return PathBuf::from(appimage)
            .parent()
            .expect("Invalid APPIMAGE path")
            .to_path_buf();
    }

    // Normal binaries (Windows / Linux)
    env::current_exe()
        .expect("Failed to get executable path")
        .parent()
        .expect("Executable has no parent directory")
        .to_path_buf()
}

pub static DATA_DIR: LazyLock<PathBuf> = LazyLock::new(|| {
    let dir = exe_dir().join("data");

    fs::create_dir_all(&dir).expect("Data directory is not writable");

    dir
});
