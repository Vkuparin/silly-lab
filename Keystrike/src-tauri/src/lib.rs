use fs2::FileExt;
use serde::Serialize;
use std::{
    fs::{self, File, OpenOptions},
    io::Write,
    path::PathBuf,
    sync::Mutex,
};
use tauri::utils::config::AppDirectoriesOverride;

struct Disk {
    root: PathBuf,
    revision: Mutex<u64>,
    _lock: File,
}
#[derive(Serialize)]
struct Loaded {
    location: String,
    candidates: Vec<String>,
}
const MAX_BYTES: u64 = 2_000_000;
fn read(path: &std::path::Path) -> Option<String> {
    if fs::metadata(path).ok()?.len() > MAX_BYTES {
        return None;
    }
    fs::read_to_string(path).ok()
}
fn revision(text: &str) -> Option<u64> {
    serde_json::from_str::<serde_json::Value>(text)
        .ok()?
        .get("revision")?
        .as_u64()
}
fn startup_error(message: &str) {
    eprintln!("{message}");
    #[cfg(windows)]
    {
        #[link(name = "user32")]
        extern "system" {
            fn MessageBoxW(hwnd: isize, text: *const u16, caption: *const u16, kind: u32) -> i32;
        }
        let body:Vec<u16>=format!("{message}\n\nMove the whole Keystrike folder to a writable location. No AppData fallback is used.").encode_utf16().chain(Some(0)).collect();
        let title: Vec<u16> = "Keystrike — portable data"
            .encode_utf16()
            .chain(Some(0))
            .collect();
        unsafe {
            MessageBoxW(0, body.as_ptr(), title.as_ptr(), 0x10);
        }
    }
}
#[tauri::command]
fn load_data(disk: tauri::State<Disk>) -> Loaded {
    let candidates = ["save.json", "save.backup.json"]
        .iter()
        .filter_map(|n| read(&disk.root.join(n)))
        .collect();
    Loaded {
        location: disk.root.to_string_lossy().into_owned(),
        candidates,
    }
}
#[tauri::command]
fn save_data(text: String, expected: u64, disk: tauri::State<Disk>) -> Result<(), String> {
    let mut current = disk.revision.lock().map_err(|e| e.to_string())?;
    if text.len() as u64 > MAX_BYTES {
        return Err("Save exceeds limit".into());
    }
    let value: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    let next = revision(&text).ok_or("Missing revision")?;
    // Recovery can select an older valid backup. Never allow a stale writer to overwrite a newer committed session.
    if next != expected + 1 || (*current != expected && *current != 0) {
        return Err("Stale save revision; restart to recover".into());
    }
    if value.get("schema").and_then(|x| x.as_u64()) != Some(2) {
        return Err("Unsupported schema".into());
    }
    let target = disk.root.join("save.json");
    let temp = disk.root.join("save.next.json");
    let write = || -> std::io::Result<()> {
        let mut file = File::create(&temp)?;
        file.write_all(text.as_bytes())?;
        file.sync_all()?;
        if target.exists() {
            let old = read(&target);
            if old.as_ref().is_some_and(|t| revision(t) == Some(expected)) {
                fs::copy(&target, disk.root.join("save.backup.json"))?;
            } else {
                fs::copy(
                    &target,
                    disk.root.join(format!(
                        "save.corrupt-{}.json",
                        std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_secs()
                    )),
                )?;
            }
        }
        fs::rename(&temp, &target)?;
        Ok(())
    };
    write().map_err(|e| e.to_string())?;
    *current = next;
    Ok(())
}
#[tauri::command]
fn exit_game(app: tauri::AppHandle) {
    app.exit(0);
}
#[tauri::command]
fn set_display(window: tauri::WebviewWindow, preset: String) -> Result<(), String> {
    if preset == "fullscreen" {
        return window.set_fullscreen(true).map_err(|e| e.to_string());
    }
    let size = match preset.as_str() {
        "1200x860" => (1200, 860),
        "1280x800" => (1280, 800),
        "1920x1080" => (1920, 1080),
        "2560x1440" => (2560, 1440),
        "3440x1440" => (3440, 1440),
        "5120x1440" => (5120, 1440),
        _ => return Err("Unsupported display preset".into()),
    };
    window.set_fullscreen(false).map_err(|e| e.to_string())?;
    if let Some(monitor) = window.current_monitor().map_err(|e| e.to_string())? {
        let logical = monitor.size().to_logical::<f64>(monitor.scale_factor());
        if size.0 as f64 > logical.width || size.1 as f64 > logical.height {
            return Err("Window preset exceeds this monitor; use fullscreen".into());
        }
    }
    window
        .set_size(tauri::LogicalSize::new(size.0 as f64, size.1 as f64))
        .map_err(|e| e.to_string())?;
    window.center().map_err(|e| e.to_string())
}
pub fn run() {
    let exe = std::env::current_exe().expect("Cannot locate executable");
    let root = exe.parent().expect("No executable directory").join("data");
    // Always portable, including WebView2 cache. Never fall back to AppData.
    if let Err(e) = fs::create_dir_all(&root) {
        startup_error(&format!(
            "Keystrike needs a writable executable folder: {e}"
        ));
        return;
    }
    let lock = match OpenOptions::new()
        .create(true)
        .truncate(false)
        .read(true)
        .write(true)
        .open(root.join("session.lock"))
    {
        Ok(f) => f,
        Err(e) => {
            startup_error(&format!("Cannot write data: {e}"));
            return;
        }
    };
    if lock.try_lock_exclusive().is_err() {
        startup_error("Keystrike is already running in this folder");
        return;
    }
    let mut context = tauri::generate_context!();
    context.config_mut().app.app_directories_override =
        Some(AppDirectoriesOverride::Root(root.clone()));
    tauri::Builder::default()
        .manage(Disk {
            root: root.clone(),
            revision: Mutex::new(0),
            _lock: lock,
        })
        .invoke_handler(tauri::generate_handler![
            load_data,
            save_data,
            set_display,
            exit_game
        ])
        .setup(move |app| {
            let window =
                tauri::WebviewWindowBuilder::from_config(app, &app.config().app.windows[0])?
                    .data_directory(root.join("webview"))
                    .on_navigation({
                        let loaded = std::sync::atomic::AtomicBool::new(false);
                        move |url| {
                            if cfg!(debug_assertions) && url.host_str() == Some("127.0.0.1") {
                                return true;
                            }
                            let local = url.scheme() == "tauri"
                                || url.host_str() == Some("tauri.localhost");
                            // The game has one document. Block back/forward navigation,
                            // including Mouse 4 browser defaults, after the initial load.
                            local && !loaded.swap(true, std::sync::atomic::Ordering::SeqCst)
                        }
                    })
                    .build()?;
            window.set_focus()?;
            Ok(())
        })
        .run(context)
        .expect("Keystrike could not start; check writable folder and WebView2 runtime");
}
