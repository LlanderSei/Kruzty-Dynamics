pub mod constants;

#[tauri::command]
fn get_platform_info() -> String {
  format!("Tauri v2 Core Online ({})", std::env::consts::OS)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(
      tauri_plugin_log::Builder::default()
        .level(log::LevelFilter::Info)
        .build(),
    )
    .invoke_handler(tauri::generate_handler![get_platform_info])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
