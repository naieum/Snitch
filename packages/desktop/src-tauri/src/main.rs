#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod crypto;
mod fingerprint;
mod license;
mod plugin_manager;
mod scan_launcher;
mod state;
mod tool_detector;

use state::AppState;
use std::sync::Mutex;

fn main() {
    // Anti-debugging check (macOS only, release builds only)
    #[cfg(all(target_os = "macos", not(debug_assertions)))]
    {
        use std::ffi::c_int;
        extern "C" {
            fn ptrace(request: c_int, pid: c_int, addr: *mut u8, data: c_int) -> c_int;
        }
        const PT_DENY_ATTACH: c_int = 31;
        unsafe {
            ptrace(PT_DENY_ATTACH, 0, std::ptr::null_mut(), 0);
        }
    }

    let app_state = AppState::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(app_state))
        .invoke_handler(tauri::generate_handler![
            commands::start_device_pairing,
            commands::poll_device_token,
            commands::check_license,
            commands::disconnect_device,
            commands::detect_tools,
            commands::install_skill,
            commands::uninstall_skill,
            commands::launch_scan,
            commands::get_launchable_tools,
            commands::get_app_info,
            commands::get_fingerprint_label,
            commands::list_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
