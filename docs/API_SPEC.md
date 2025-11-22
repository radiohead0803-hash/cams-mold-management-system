# API Specification – Mold Check & Transfer Operations

## Overview
- **Purpose**: Provides the REST/GraphQL endpoints used by mobile/PC clients to fetch checklist metadata, submit inspection results, upload photos/documents, and capture transfer approvals.
- **Base URL**: `https://{domain}/api`
- **Authentication**: JWT in `Authorization: Bearer <token>` header. Tokens issued after QR/GPS login (see `LOGIN_AND_PERMISSIONS.md`).
- **Common headers**:
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `X-Request-ID`: UUID for traceability

---

## Endpoints

### 1. `POST /checklists/daily/start`
| Field | Type | Description |
|------|------|-------------|
| `mold_id` | UUID | 금형 고유 ID (QR 코드 기반) |
| `user_id` | UUID | 현장 작업자 ID |
| `location` | {lat, lng} | 캡처된 GPS 좌표 |
| `shot_count` | Integer | 현재 누적 쇼트 수 |
| `checklist_type` | `"daily"` | 고정값 |

**Response**: `checklist_id`, `items` (array with `category`, `item_id`, `is_required`, `guide_photos`, `guide_documents`).

### 2. `PATCH /checklists/daily/{checklist_id}`
Allows partial updates as worker records item statuses.
```json
{
  "item_status": [
    {"item_id": 123, "status": "good", "notes": "Cleaned on-site", "photo_refs": ["photo-uuid"], "cleaning_agent": "dry_ice", "dilution_ratio": "1:5"}
  ],
  "confirmed_by": "user-uuid",
  "confirmed_at": "2025-11-20T14:10:00Z"
}
```

**Behavior**: validates `shot_count >= previous_shot`; triggers SPC alert when `shot_count >= milestone`.

### 3. `POST /checklists/transfer/request`
Used when initiating a mold transfer.
Payload includes transfer-specific metadata that is deduplicated from `daily_checks`:
- `transfer_date`, `transfer_type` (`inter-plant`, `vendor`), `target_company_id`.
- `material_summary` (auto-filled from `maker_info`).
- `photo_refs` (array of uploaded photo IDs).
- `document_refs` (PDFs/Excel files attached via `/files/upload`).

**Response**: Transfer workflow object (`workflow_id`, `status`, `next_approver`).

### 4. `POST /checklists/photos`
Uploads inspection photos/documents.
- Accepts `multipart/form-data` with fields:
  - `checklist_id`, `uploaded_by`, `shot_count`, `item_category`, `file` (image/pdf).
  - `metadata`: JSON string containing `{"description", "angle","light_condition"}`.
- Server stores files in S3/온프레미스 (see `DATA_FLOW_ARCHITECTURE.md`).
- Returns `photo_id`, `url`, `thumbnail_url`, `category`, `file_type`, `uploaded_at`.

### 5. `PATCH /checklists/transfer/{workflow_id}/confirm`
Used by receiving company.
Payload: `confirmed_by`, `confirmed_at`, `status` (`accepted`, `rejected`), `notes`, `document_refs`.
Also optionally links to `maintenance_requests` if `status == "rejected"`.

### 6. `GET /checklists/history?mold_id={}`
Returns timeline containing daily/periodic/transfer checklists, photo references, `issue` links, and approvals.
Fields: `checklist_id`, `type`, `shot_count`, `status`, `photos`, `documents`, `approver`, `issues`.

---

## Related Workflows
1. **Alert Integration**: hitting shot milestones (20K/50K/80K) triggers `POST /alerts/trigger` with payload linking to `checklist_id`.
2. **Document Generation**: on completion the backend calls `POST /reports/generate` (see `Report_Templates.md`). The document includes `photo_refs` plus item statuses.
3. **Approval Flow**: approval steps recorded via `/approvals/step` referencing `workflow_id` (transfer-specific) and `checklist_id`.

---

## Pagination & Filtering
- Query params supported: `?page=1&per_page=20&status=pending&category=cleaning`
- Filtering keys: `user_id`, `plant_id`, `creator_role`, `transfer_type`, `shot_range`.

---

## Error Handling
- `400`: validation (missing `shot_count`, invalid `photo_refs`).
- `401`: token expiry / missing QR scope.
- `409`: duplicate transfer request within 24h.
- `422`: `shot_count` lower than last submitted value.
- `500`: storage/upload failure.

---

## Notes
- Each checklist API call logs `request_id` + `trace_id` for observability.
- Files stored with `mold-<shot>-<item>-<timestamp>.jpg` to match UI naming guidance.
