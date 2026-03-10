use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, KeyInit};
use argon2::{Argon2, Params, Algorithm, Version};
use sha2::{Sha256, Digest};
use zeroize::Zeroize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Encryption failed")]
    EncryptionFailed(String),
    #[error("Decryption failed")]
    DecryptionFailed(String),
    #[error("Key derivation failed")]
    KeyDerivationFailed(String),
}

/// Derive an AES-256 key from the machine fingerprint using Argon2id
fn derive_key(fingerprint: &str, salt: &[u8]) -> Result<[u8; 32], CryptoError> {
    let params = Params::new(65536, 3, 1, Some(32))
        .map_err(|e| CryptoError::KeyDerivationFailed(e.to_string()))?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut key = [0u8; 32];
    argon2
        .hash_password_into(fingerprint.as_bytes(), salt, &mut key)
        .map_err(|e| CryptoError::KeyDerivationFailed(e.to_string()))?;
    Ok(key)
}

/// Encrypt data with AES-256-GCM using a key derived from the fingerprint
/// Output format: [16-byte random salt][12-byte nonce][ciphertext+tag]
pub fn encrypt_token(token: &str, fingerprint: &str) -> Result<Vec<u8>, CryptoError> {
    let salt: [u8; 16] = rand::random();
    let mut key_bytes = derive_key(fingerprint, &salt)?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let nonce_bytes: [u8; 12] = rand::random();
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher.encrypt(nonce, token.as_bytes())
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()));

    key_bytes.zeroize();

    let ciphertext = ciphertext?;
    let mut result = Vec::with_capacity(16 + 12 + ciphertext.len());
    result.extend_from_slice(&salt);
    result.extend_from_slice(&nonce_bytes);
    result.extend(ciphertext);
    Ok(result)
}

/// Decrypt data with AES-256-GCM
/// Input format: [16-byte salt][12-byte nonce][ciphertext+tag]
pub fn decrypt_token(encrypted: &[u8], fingerprint: &str) -> Result<String, CryptoError> {
    if encrypted.len() < 28 {
        return Err(CryptoError::DecryptionFailed("Data too short".to_string()));
    }

    let salt = &encrypted[..16];
    let nonce_bytes = &encrypted[16..28];
    let ciphertext = &encrypted[28..];

    let mut key_bytes = derive_key(fingerprint, salt)?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher.decrypt(nonce, ciphertext)
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()));

    key_bytes.zeroize();

    let mut plaintext = plaintext?;
    let result = String::from_utf8(plaintext.clone())
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()));
    plaintext.zeroize();
    result
}

/// Compute SHA-256 hash of data
pub fn sha256_hex(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hex::encode(hasher.finalize())
}

/// Compute HMAC-SHA256 for file integrity verification
pub fn hmac_sha256(key: &[u8], data: &[u8]) -> String {
    use hmac::{Hmac, Mac};
    type HmacSha256 = Hmac<Sha256>;

    let mut mac = <HmacSha256 as Mac>::new_from_slice(key)
        .expect("HMAC can take key of any size");
    mac.update(data);
    hex::encode(mac.finalize().into_bytes())
}
