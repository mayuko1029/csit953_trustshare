# Security Notes

## Principles
- AES-GCM for encryption; unique nonces per (key, message).
- ECDSA (P-256) signatures with SHA-256 over canonical file hash.
- Keys never logged; secrets via environment variables only.

## Operational
- Enforce HTTPS outside local dev.
- Do not store plaintext content.
- Redact secrets/tokens from logs.
