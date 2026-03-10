use crate::crypto;
use crate::fingerprint::MachineFingerprint;
use crate::state::LicenseInfo;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use thiserror::Error;

const API_BASE: &str = "https://snitch.live";
const KEYRING_SERVICE: &str = "snitch-desktop";
const KEYRING_USER: &str = "activation-token";

#[derive(Error, Debug)]
pub enum LicenseError {
    #[error("Network error: {0}")]
    Network(String),
    #[error("API error: {0}")]
    Api(String),
    #[error("Token storage error: {0}")]
    Storage(String),
    #[error("Not paired")]
    NotPaired,
    #[error("License expired")]
    Expired,
    #[error("Purchase required")]
    PurchaseRequired,
    #[error("Activation limit reached")]
    ActivationLimit,
}

#[derive(Serialize)]
struct DeviceCodeRequest {
    client_type: String,
    fingerprint: String,
    components: Vec<String>,
    machine_label: String,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct DeviceCodeResponse {
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    pub interval: u64,
}

#[derive(Serialize)]
struct TokenPollRequest {
    device_code: String,
}

#[derive(Deserialize)]
pub struct TokenResponse {
    pub access_token: Option<String>,
    pub error: Option<String>,
}

#[derive(Deserialize)]
pub struct HeartbeatResponse {
    pub status: Option<String>,
    pub tier: Option<String>,
    pub email: Option<String>,
    pub activations_used: Option<u32>,
    pub activations_max: Option<u32>,
    pub error: Option<String>,
}

fn build_client() -> Result<reqwest::Client, LicenseError> {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .connect_timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| LicenseError::Network(e.to_string()))
}

/// Generate an ISO 8601 timestamp from SystemTime without chrono
fn now_iso8601() -> String {
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();

    // Calculate date/time components from unix timestamp
    let days = secs / 86400;
    let time_of_day = secs % 86400;
    let hours = time_of_day / 3600;
    let minutes = (time_of_day % 3600) / 60;
    let seconds = time_of_day % 60;

    // Calculate year, month, day from days since epoch (1970-01-01)
    let mut y = 1970i64;
    let mut remaining_days = days as i64;

    loop {
        let days_in_year = if is_leap_year(y) { 366 } else { 365 };
        if remaining_days < days_in_year {
            break;
        }
        remaining_days -= days_in_year;
        y += 1;
    }

    let leap = is_leap_year(y);
    let month_days = if leap {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };

    let mut m = 0usize;
    for (i, &md) in month_days.iter().enumerate() {
        if remaining_days < md {
            m = i;
            break;
        }
        remaining_days -= md;
    }

    let month = m + 1;
    let day = remaining_days + 1;

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        y, month, day, hours, minutes, seconds
    )
}

fn is_leap_year(y: i64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)
}

pub async fn request_device_code(
    fp: &MachineFingerprint,
) -> Result<DeviceCodeResponse, LicenseError> {
    let client = build_client()?;
    let resp = client
        .post(format!("{}/api/auth/device", API_BASE))
        .json(&DeviceCodeRequest {
            client_type: "desktop".to_string(),
            fingerprint: fp.combined.clone(),
            components: fp.components.clone(),
            machine_label: fp.label.clone(),
        })
        .send()
        .await
        .map_err(|e| LicenseError::Network(e.to_string()))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let body = resp.text().await.unwrap_or_default();
        if body.contains("purchase_required") || body.contains("Purchase required") {
            return Err(LicenseError::PurchaseRequired);
        }
        return Err(LicenseError::Api(format!("Server error (HTTP {})", status)));
    }

    resp.json::<DeviceCodeResponse>()
        .await
        .map_err(|e| LicenseError::Api(e.to_string()))
}

pub async fn poll_for_token(device_code: &str) -> Result<Option<String>, LicenseError> {
    let client = build_client()?;
    let resp = client
        .post(format!("{}/api/auth/device/token", API_BASE))
        .json(&TokenPollRequest {
            device_code: device_code.to_string(),
        })
        .send()
        .await
        .map_err(|e| LicenseError::Network(e.to_string()))?;

    let token_resp: TokenResponse = resp
        .json()
        .await
        .map_err(|e| LicenseError::Api(e.to_string()))?;

    if let Some(token) = token_resp.access_token {
        Ok(Some(token))
    } else if token_resp.error.as_deref() == Some("authorization_pending") {
        Ok(None)
    } else if token_resp.error.as_deref() == Some("expired_token") {
        Err(LicenseError::Expired)
    } else {
        Err(LicenseError::Api(
            token_resp
                .error
                .unwrap_or_else(|| "Unknown error".to_string()),
        ))
    }
}

pub async fn heartbeat(
    token: &str,
    fp: &MachineFingerprint,
) -> Result<LicenseInfo, LicenseError> {
    let client = build_client()?;
    let resp = client
        .post(format!("{}/api/license/heartbeat", API_BASE))
        .bearer_auth(token)
        .json(&serde_json::json!({
            "fingerprint": fp.combined,
            "components": fp.components,
        }))
        .send()
        .await
        .map_err(|e| LicenseError::Network(e.to_string()))?;

    let status = resp.status().as_u16();
    if status == 401 {
        return Err(LicenseError::Expired);
    }

    if status >= 400 {
        let body = resp.text().await.unwrap_or_default();
        if let Ok(err_obj) = serde_json::from_str::<serde_json::Value>(&body) {
            if let Some(err_msg) = err_obj.get("error").and_then(|v| v.as_str()) {
                if err_msg.contains("activation_limit") || err_msg.contains("Activation limit") {
                    return Err(LicenseError::ActivationLimit);
                }
                if err_msg.contains("Purchase required") {
                    return Err(LicenseError::PurchaseRequired);
                }
                return Err(LicenseError::Api(err_msg.to_string()));
            }
        }
        return Err(LicenseError::Api(format!("Server error (HTTP {})", status)));
    }

    let hb: HeartbeatResponse = resp
        .json()
        .await
        .map_err(|e| LicenseError::Api(format!("Failed to parse heartbeat response: {}", e)))?;

    if let Some(err) = hb.error {
        if err.contains("activation_limit") {
            return Err(LicenseError::ActivationLimit);
        }
        return Err(LicenseError::Api(err));
    }

    Ok(LicenseInfo {
        status: hb.status.unwrap_or_else(|| "active".to_string()),
        tier: hb.tier.unwrap_or_else(|| "standard".to_string()),
        email: hb.email,
        activations_used: hb.activations_used.unwrap_or(1),
        activations_max: hb.activations_max.unwrap_or(3),
        machine_label: fp.label.clone(),
        last_heartbeat: Some(now_iso8601()),
    })
}

pub fn store_token(token: &str, fingerprint: &str) -> Result<(), LicenseError> {
    let encrypted =
        crypto::encrypt_token(token, fingerprint).map_err(|e| LicenseError::Storage(e.to_string()))?;
    let encoded = hex::encode(&encrypted);

    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|e| LicenseError::Storage(e.to_string()))?;
    entry
        .set_password(&encoded)
        .map_err(|e| LicenseError::Storage(e.to_string()))?;
    Ok(())
}

pub fn load_token(fingerprint: &str) -> Result<String, LicenseError> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|e| LicenseError::Storage(e.to_string()))?;
    let encoded = entry
        .get_password()
        .map_err(|_| LicenseError::NotPaired)?;
    let encrypted =
        hex::decode(&encoded).map_err(|e| LicenseError::Storage(e.to_string()))?;
    crypto::decrypt_token(&encrypted, fingerprint).map_err(|e| LicenseError::Storage(e.to_string()))
}

pub fn delete_token() -> Result<(), LicenseError> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|e| LicenseError::Storage(e.to_string()))?;
    entry
        .delete_credential()
        .map_err(|e| LicenseError::Storage(e.to_string()))?;
    Ok(())
}
