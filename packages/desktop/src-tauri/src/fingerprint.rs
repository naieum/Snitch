use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MachineFingerprint {
    pub combined: String,
    pub components: Vec<String>,
    pub label: String,
}

impl MachineFingerprint {
    pub fn generate() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();

        let machine_id = get_machine_uuid();
        let cpu_model = System::cpu_arch();
        let cpu_cores = sys.cpus().len().to_string();
        let total_ram_gb = format!("{}", sys.total_memory() / 1_073_741_824);
        let os_type = std::env::consts::OS.to_string();

        let signals = vec![
            machine_id,
            cpu_model.clone(),
            cpu_cores,
            total_ram_gb,
            os_type.clone(),
        ];
        let components: Vec<String> = signals.iter().map(|s| hash_signal(s)).collect();
        let combined_input = components.join(":");
        let combined = hash_signal(&combined_input);

        let label = format!("{} ({})", cpu_model, os_type);

        Self {
            combined,
            components,
            label,
        }
    }
}

fn hash_signal(input: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    hex::encode(hasher.finalize())
}

#[cfg(target_os = "macos")]
fn get_machine_uuid() -> String {
    std::process::Command::new("ioreg")
        .args(["-rd1", "-c", "IOPlatformExpertDevice"])
        .output()
        .ok()
        .and_then(|output| {
            let stdout = String::from_utf8_lossy(&output.stdout);
            stdout
                .lines()
                .find(|line| line.contains("IOPlatformUUID"))
                .and_then(|line| line.split('"').nth(3).map(String::from))
        })
        .unwrap_or_else(|| "unknown-mac".to_string())
}

#[cfg(target_os = "linux")]
fn get_machine_uuid() -> String {
    std::fs::read_to_string("/etc/machine-id")
        .unwrap_or_else(|_| "unknown-linux".to_string())
        .trim()
        .to_string()
}

#[cfg(target_os = "windows")]
fn get_machine_uuid() -> String {
    std::process::Command::new("reg")
        .args([
            "query",
            r"HKLM\SOFTWARE\Microsoft\Cryptography",
            "/v",
            "MachineGuid",
        ])
        .output()
        .ok()
        .and_then(|output| {
            let stdout = String::from_utf8_lossy(&output.stdout);
            stdout
                .lines()
                .find(|line| line.contains("MachineGuid"))
                .and_then(|line| line.split_whitespace().last().map(String::from))
        })
        .unwrap_or_else(|| "unknown-windows".to_string())
}
