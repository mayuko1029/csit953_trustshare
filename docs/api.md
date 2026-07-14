# API Reference (Draft)

Base URL (local): `http://localhost:8000`

> ⚠️ Draft: endpoints will evolve as you implement access requests, approvals, and downloads.

## Health
**GET** `/health` → `{ "status": "ok" }`

## Files
### Upload
**POST** `/files` (multipart `file`)
- Request: binary file payload
- Response:
```json
{
  "id": "abcd1234ef567890",
  "hash": "<sha256 plaintext>",
  "sig": "<base64 ECDSA signature>"
}
```

### Metadata
**GET** `/files/{id}` → demo metadata:
```json
{ "id": "abcd1234ef567890", "hash": "todo" }
```

### Future
- `POST /access-requests`
- `POST /approvals/{id}`
- `GET /files/{id}/download`
- `GET /events?file=<id>`
