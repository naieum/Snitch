## CATEGORY 34: FIPS 140-3 / Cryptographic Compliance

> **Cross-reference:** Overlaps with Category 9 (Cryptography). Only flag here when there is specific FIPS compliance context (regulated environment, government contract, healthcare, finance). For general crypto weaknesses defer to Cat 9.

### Detection
- `crypto`, `node:crypto`, `openssl`, `crypto-js`, `forge`, `jose` imports
- TLS/SSL config files, nginx/haproxy configs with cipher suite settings
- `.env` files with `TLS_*`, `SSL_*`, `CIPHER_*` vars
- Files containing `createCipheriv`, `createDecipheriv`, `createHash`

### What to Search For
- Hash function usage: `md5`, `sha1`, `sha-1` in security contexts (signing, auth)
- Cipher names: `RC4`, `DES`, `3DES`, `Blowfish`, `RC2`, `IDEA`
- TLS version strings: `TLSv1`, `TLSv1.1`, `TLSv1.0`, `SSLv3`
- Key size parameters: RSA modulus < 2048, EC curves < 224-bit (secp192r1, prime192v1)
- FIPS mode disabled: `crypto.setFips(false)`, `OPENSSL_NO_FIPS`, absence of `fips: true` in regulated context
- Custom crypto: manual XOR operations, custom PRNG, seed-based random used for tokens or IVs

### Critical
- Non-FIPS symmetric cipher (RC4, DES, 3DES, Blowfish) used for data encryption
- MD5 or SHA-1 used for digital signatures or password hashing in production
- TLS 1.0 or 1.1 explicitly permitted in production TLS config
- RSA key < 2048 bits generated or hardcoded

### High
- `Math.random()` used as initialization vector (IV) or for token generation
- SHA-1 used for HMAC in authentication contexts
- Elliptic curve < 224-bit (e.g., secp192r1)
- FIPS mode explicitly disabled (`crypto.setFips(false)`) with no compensating control
- `rejectUnauthorized: false` in production TLS client (not gated to dev)

### Medium
- SHA-1 used only for non-security checksums (flag with note to confirm context)
- Cipher suites not in NIST-approved list for TLS 1.2

### Context Check
1. Is this a regulated environment (government, federal contractor, healthcare, finance)?
2. Is the algorithm used for security (auth, signing, encryption) or just checksums/cache keys?
3. Is `rejectUnauthorized: false` or TLS 1.0 gated to dev/test environments only?

### NOT Vulnerable (False Positives)
- MD5 used only for cache keys or non-security ETags
- SHA-1 used only for git object IDs or non-security checksums
- TLS 1.0/1.1 configuration in files clearly marked as test-only / local dev
- FIPS-approved algorithms: AES-128-GCM, AES-256-GCM, SHA-256, SHA-384, SHA-512, ECDSA P-256/P-384, RSA-2048+

### Files to Check
- `**/crypto*.{ts,js}`, `**/tls*.{ts,js}`, `**/ssl*.{ts,js}`
- `nginx.conf`, `haproxy.cfg`, `*.pem`, `.env*`
- Any file with `createCipheriv`, `createHash`, `generateKeyPair`
