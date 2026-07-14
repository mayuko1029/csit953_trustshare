# Threat Model (STRIDE) — Draft

| Threat | Example | Mitigation |
|---|---|---|
| Spoofing | Fake requester | JWT/oidc + address ownership verification |
| Tampering | Blob altered at rest | AES-GCM integrity + canonical hash verify |
| Repudiation | Deny actions | Append-only logs + tx receipts |
| Info Disclosure | Key/JWT leak | Key wrapping per recipient, short TTL, rotation |
| DoS | Upload floods | Rate/size limits, backpressure |
| Elevation of Privilege | Unauthorized read | Role checks + approval workflow + contract checks |
