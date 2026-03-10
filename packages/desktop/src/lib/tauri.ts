import { invoke } from "@tauri-apps/api/core";

// ── Types matching the Rust structs ─────────────────────────────

export interface LicenseInfo {
  status: string;
  tier: string;
  email: string | null;
  activations_used: number;
  activations_max: number;
  machine_label: string;
  last_heartbeat: string | null;
}

export interface DeviceCodeInfo {
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface ToolInfo {
  id: string;
  name: string;
  tool_type: "cli" | "ide";
  detected: boolean;
  snitch_loaded: boolean;
  install_path: string | null;
}

export interface ScanLaunchResult {
  launched: boolean;
  direct: boolean;
  message: string;
  tool_id: string;
  project_path: string;
}

export interface LaunchableTool {
  id: string;
  name: string;
  direct: boolean;
  available: boolean;
}

export interface AppInfo {
  version: string;
  machine_label: string;
}

// ── Commands ────────────────────────────────────────────────────

export async function startDevicePairing(): Promise<DeviceCodeInfo> {
  return invoke("start_device_pairing");
}

export async function pollDeviceToken(): Promise<boolean> {
  return invoke("poll_device_token");
}

export async function checkLicense(): Promise<LicenseInfo | null> {
  return invoke("check_license");
}

export async function disconnectDevice(): Promise<void> {
  return invoke("disconnect_device");
}

export async function detectTools(
  projectPaths: string[],
): Promise<ToolInfo[]> {
  return invoke("detect_tools", { projectPaths });
}

export async function installSkill(
  toolId: string,
  projectPath?: string,
): Promise<string> {
  return invoke("install_skill", { toolId, projectPath });
}

export async function uninstallSkill(
  toolId: string,
  projectPath?: string,
): Promise<void> {
  return invoke("uninstall_skill", { toolId, projectPath });
}

export async function launchScan(
  toolId: string,
  projectPath: string,
): Promise<ScanLaunchResult> {
  return invoke("launch_scan", { toolId, projectPath });
}

export async function getLaunchableTools(
  projectPath: string,
): Promise<LaunchableTool[]> {
  return invoke("get_launchable_tools", { projectPath });
}

export async function getAppInfo(): Promise<AppInfo> {
  return invoke("get_app_info");
}

export async function getFingerprintLabel(): Promise<string> {
  return invoke("get_fingerprint_label");
}

export interface DirEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

export async function listDirectory(path: string): Promise<DirEntry[]> {
  return invoke("list_directory", { path });
}
