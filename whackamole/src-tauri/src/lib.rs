use std::path::PathBuf;
use tauri::utils::config::AppDirectoriesOverride;
use tauri::Manager;

/// Portable mode: when a `portable.txt` marker sits next to the executable
/// (shipped inside the portable zip), all app data — high scores, language
/// choice, and the WebView2 profile — is redirected to `<exe_dir>/data`,
/// so deleting the app folder removes every trace.
///
/// Installed builds have no marker and keep the default %APPDATA% location,
/// which is always writable even when the app lives in Program Files.
fn portable_data_dir_enabled() -> bool {
  std::env::current_exe()
    .ok()
    .and_then(|exe| exe.parent().map(|dir| dir.join("portable.txt")))
    .is_some_and(|marker| marker.is_file())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut context = tauri::generate_context!();

  if portable_data_dir_enabled() {
    // Relative to the app binary: config/data/local-data resolve to
    // `<exe_dir>/data`, cache to `<exe_dir>/data/caches`, logs to
    // `<exe_dir>/data/logs`. On Windows the webview data directory follows
    // `app_local_data_dir`, so the whole profile stays in the app folder.
    context.config_mut().app.app_directories_override =
      Some(AppDirectoriesOverride::Root(PathBuf::from("data")));
  }

  tauri::Builder::default()
    .setup(|app| {
      if let Some(window) = app.get_webview_window("main") {
        if let Some(monitor) = window.current_monitor()? {
          let area = monitor.work_area();
          let scale = monitor.scale_factor();
          let width = (area.size.width as f64 / scale - 32.0).clamp(400.0, 1100.0);
          let height = (area.size.height as f64 / scale - 48.0).clamp(400.0, 720.0);
          window.set_min_size(Some(tauri::LogicalSize::new(width.min(800.0), height.min(560.0))))?;
          window.set_size(tauri::LogicalSize::new(width, height))?;
          window.center()?;
        }
      }
      Ok(())
    })
    .run(context)
    .expect("error while running tauri application");
}
