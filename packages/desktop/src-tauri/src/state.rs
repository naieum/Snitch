use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

#[derive(Clone, Serialize, Deserialize)]
pub struct LicenseInfo {
    pub status: String,
    pub tier: String,
    pub email: Option<String>,
    pub activations_used: u32,
    pub activations_max: u32,
    pub machine_label: String,
    pub last_heartbeat: Option<String>,
}

// Manual Debug to avoid leaking email
impl std::fmt::Debug for LicenseInfo {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("LicenseInfo")
            .field("status", &self.status)
            .field("tier", &self.tier)
            .field("email", &"[redacted]")
            .field("activations_used", &self.activations_used)
            .field("activations_max", &self.activations_max)
            .finish()
    }
}

pub struct AppState {
    pub license: Option<LicenseInfo>,
    pub access_token: Option<String>,
    pub device_code: Option<String>,
    pub is_paired: bool,
}

// Manual Debug to avoid leaking tokens
impl std::fmt::Debug for AppState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AppState")
            .field("is_paired", &self.is_paired)
            .field("has_token", &self.access_token.is_some())
            .field("has_device_code", &self.device_code.is_some())
            .finish()
    }
}

impl AppState {
    pub fn new() -> Self {
        Self {
            license: None,
            access_token: None,
            device_code: None,
            is_paired: false,
        }
    }
}

impl Drop for AppState {
    fn drop(&mut self) {
        if let Some(ref mut token) = self.access_token {
            token.zeroize();
        }
        if let Some(ref mut code) = self.device_code {
            code.zeroize();
        }
    }
}
