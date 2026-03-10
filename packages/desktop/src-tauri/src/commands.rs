use crate::fingerprint::MachineFingerprint;
use crate::license;
use crate::plugin_manager;
use crate::scan_launcher;
use crate::state::{AppState, LicenseInfo};
use crate::tool_detector;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

const VALID_TOOL_IDS: &[&str] = &[
    "claude", "gemini", "codex", "copilot-cli", "cursor", "windsurf",
    "cline", "kilo", "roo", "zed", "copilot-vscode", "aider", "continue",
];

fn validate_tool_id(tool_id: &str) -> Result<(), String> {
    if !VALID_TOOL_IDS.contains(&tool_id) {
        return Err(format!("Invalid tool: {}", tool_id));
    }
    Ok(())
}

fn validate_project_path(path: &str) -> Result<std::path::PathBuf, String> {
    let p = std::path::Path::new(path);
    if !p.is_absolute() {
        return Err("Project path must be absolute".to_string());
    }
    let canonical = p.canonicalize()
        .map_err(|e| format!("Invalid project path: {}", e))?;
    if !canonical.is_dir() {
        return Err("Project path is not a directory".to_string());
    }
    Ok(canonical)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevicePairingInfo {
    pub user_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    pub interval: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub version: String,
    pub machine_label: String,
}

/// Start the device pairing flow
#[tauri::command]
pub async fn start_device_pairing(
    state: State<'_, Mutex<AppState>>,
) -> Result<DevicePairingInfo, String> {
    let fp = MachineFingerprint::generate();

    let resp = license::request_device_code(&fp)
        .await
        .map_err(|e| e.to_string())?;

    // Store device code in state for polling
    {
        let mut app_state = state.lock().map_err(|e| e.to_string())?;
        app_state.device_code = Some(resp.device_code.clone());
    }

    Ok(DevicePairingInfo {
        user_code: resp.user_code,
        verification_uri: resp.verification_uri,
        expires_in: resp.expires_in,
        interval: resp.interval,
    })
}

/// Poll for device token (called on interval by frontend)
#[tauri::command]
pub async fn poll_device_token(
    state: State<'_, Mutex<AppState>>,
) -> Result<bool, String> {
    let device_code = {
        let app_state = state.lock().map_err(|e| e.to_string())?;
        app_state
            .device_code
            .clone()
            .ok_or_else(|| "No device code. Start pairing first.".to_string())?
    };

    let result = license::poll_for_token(&device_code)
        .await
        .map_err(|e| e.to_string())?;

    match result {
        Some(token) => {
            let fp = MachineFingerprint::generate();

            // Store token in keychain
            license::store_token(&token, &fp.combined).map_err(|e| e.to_string())?;

            // Update state
            {
                let mut app_state = state.lock().map_err(|e| e.to_string())?;
                app_state.access_token = Some(token.clone());
                app_state.is_paired = true;
                app_state.device_code = None;
            }

            // Do initial heartbeat to get license info
            let license_info = license::heartbeat(&token, &fp)
                .await
                .map_err(|e| e.to_string())?;

            {
                let mut app_state = state.lock().map_err(|e| e.to_string())?;
                app_state.license = Some(license_info);
            }

            Ok(true)
        }
        None => Ok(false), // Still pending
    }
}

/// Check current license status (loads from keychain if needed)
#[tauri::command]
pub async fn check_license(
    state: State<'_, Mutex<AppState>>,
) -> Result<Option<LicenseInfo>, String> {
    let fp = MachineFingerprint::generate();

    // Try to load token from state first, then from keychain
    let token = {
        let app_state = state.lock().map_err(|e| e.to_string())?;
        app_state.access_token.clone()
    };

    let token = match token {
        Some(t) => t,
        None => match license::load_token(&fp.combined) {
            Ok(t) => {
                let mut app_state = state.lock().map_err(|e| e.to_string())?;
                app_state.access_token = Some(t.clone());
                app_state.is_paired = true;
                t
            }
            Err(_) => return Ok(None), // Not paired
        },
    };

    // Heartbeat to verify license
    match license::heartbeat(&token, &fp).await {
        Ok(info) => {
            let mut app_state = state.lock().map_err(|e| e.to_string())?;
            app_state.license = Some(info.clone());
            Ok(Some(info))
        }
        Err(license::LicenseError::Expired) => {
            // Token expired, clean up
            let _ = license::delete_token();
            let mut app_state = state.lock().map_err(|e| e.to_string())?;
            app_state.access_token = None;
            app_state.is_paired = false;
            app_state.license = None;
            Err("License expired. Please re-pair your device.".to_string())
        }
        Err(_) => {
            // Network error - return cached license or offline placeholder
            let mut app_state = state.lock().map_err(|e| e.to_string())?;
            if let Some(ref cached) = app_state.license {
                Ok(Some(cached.clone()))
            } else {
                // We have a token but can't reach server — treat as paired but offline
                let offline = LicenseInfo {
                    status: "offline".to_string(),
                    tier: "standard".to_string(),
                    email: None,
                    activations_used: 0,
                    activations_max: 0,
                    machine_label: fp.label.clone(),
                    last_heartbeat: None,
                };
                app_state.license = Some(offline.clone());
                Ok(Some(offline))
            }
        }
    }
}

/// Disconnect device (remove stored token)
#[tauri::command]
pub async fn disconnect_device(
    state: State<'_, Mutex<AppState>>,
) -> Result<(), String> {
    let _ = license::delete_token();

    let mut app_state = state.lock().map_err(|e| e.to_string())?;
    app_state.access_token = None;
    app_state.is_paired = false;
    app_state.license = None;
    app_state.device_code = None;

    Ok(())
}

/// Detect installed AI coding tools
#[tauri::command]
pub async fn detect_tools(
    project_paths: Vec<String>,
) -> Result<Vec<tool_detector::ToolInfo>, String> {
    Ok(tool_detector::detect_all_tools(&project_paths))
}

/// Install snitch skill for a specific tool
#[tauri::command]
pub async fn install_skill(
    app_handle: tauri::AppHandle,
    tool_id: String,
    project_path: Option<String>,
) -> Result<String, String> {
    validate_tool_id(&tool_id)?;
    if let Some(ref pp) = project_path {
        validate_project_path(pp)?;
    }
    plugin_manager::install_skill(
        &app_handle,
        &tool_id,
        project_path.as_deref(),
        None, // Watermark can be added later when license info provides user hash
    )
    .map_err(|e| e.to_string())
}

/// Uninstall snitch skill for a specific tool
#[tauri::command]
pub async fn uninstall_skill(
    tool_id: String,
    project_path: Option<String>,
) -> Result<(), String> {
    validate_tool_id(&tool_id)?;
    if let Some(ref pp) = project_path {
        validate_project_path(pp)?;
    }
    plugin_manager::uninstall_skill(&tool_id, project_path.as_deref()).map_err(|e| e.to_string())
}

/// Launch a security scan using a specific tool
#[tauri::command]
pub async fn launch_scan(
    tool_id: String,
    project_path: String,
) -> Result<scan_launcher::ScanLaunchResult, String> {
    validate_tool_id(&tool_id)?;
    let validated_path = validate_project_path(&project_path)?;
    scan_launcher::launch_scan(&tool_id, &validated_path.to_string_lossy())
        .map_err(|e| e.to_string())
}

/// Get all tools available for launching scans
#[tauri::command]
pub async fn get_launchable_tools(
    project_path: String,
) -> Result<Vec<scan_launcher::LaunchableTool>, String> {
    validate_project_path(&project_path)?;
    Ok(scan_launcher::get_launchable_tools(&project_path))
}

/// Get app info (version, machine label)
#[tauri::command]
pub async fn get_app_info() -> Result<AppInfo, String> {
    let fp = MachineFingerprint::generate();
    Ok(AppInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        machine_label: fp.label,
    })
}

/// Get human-readable machine label for the fingerprint
#[tauri::command]
pub async fn get_fingerprint_label() -> Result<String, String> {
    let fp = MachineFingerprint::generate();
    Ok(fp.label)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

/// List directory contents (folders only, for the folder browser)
#[tauri::command]
pub async fn list_directory(path: String) -> Result<Vec<DirEntry>, String> {
    let dir = std::path::Path::new(&path);
    if !dir.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    let mut entries = Vec::new();
    let read_dir = std::fs::read_dir(dir).map_err(|e| format!("Cannot read directory: {}", e))?;

    for entry in read_dir {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        let file_type = match entry.file_type() {
            Ok(ft) => ft,
            Err(_) => continue,
        };
        if !file_type.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        // Skip hidden directories
        if name.starts_with('.') {
            continue;
        }
        let path = entry.path().to_string_lossy().to_string();
        entries.push(DirEntry { name, path, is_dir: true });
    }

    entries.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(entries)
}
