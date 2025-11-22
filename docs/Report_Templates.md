# Report Templates for Mold Transfer & Inspection

## Overview
- **Purpose**: Outline PDF/Excel templates that auto-populate from checklist data so stakeholders can confirm condition, transfer progress, and attached evidence.
- **Data Source**: `daily_check_items`, `daily_check_item_status`, `inspection_photos`, `transfer_management`, `transfer_checklist` tables (see `DATABASE_SCHEMA.md`).

---

## 1. Transfer Request Form (PDF)
- **Audience**: Production plant initiating transfer and recipient approval.
- **Sections**:
  1. Header with QR/품번, 품명, 현재 위치, 등록자, 생성 시간.
  2. `Transfer metadata`: 제출 일자, 예상 도착 공장, 진행 상태 (draft/approved), 요청자.
  3. `Condition Summary` table: sourced from `daily_check_item_status` (items with `category IN ('세척','습합','외관')`). Columns: `항목`, `상태 (양호/주의/불량)`, `특이사항`, `첨부 사진` (list file names), `청소제/희석 ratio`.
  4. Attached evidence list: `inspection_photos` with captions, uploader, shot_count.
  5. Approvals: signer placeholders (Production → CAMS → Recipient), each with signature line + timestamp.
- **Notes**: Include QR code linked to checklist history, plus `xxx` file names stored via `/checklists/photos`.

## 2. Transfer Confirmation / Receipt Sheet (PDF)
- **Audience**: Receiving plant / partner verifying condition.
- **Sections**:
  1. Transfer ID/Workflow status + origin/destination.
  2. Verification checklist referencing `management status table` from `DAILY_CHECK_ITEMS.md`. Each row has `항목`, `결과`, `사진/문서` link, `확인(업체)` checkbox status, `담당자 서명`.
  3. `Non-conformance` section: populated if any `daily_check_item_status.status IN ('warning','bad')` → auto-fill `issue_id` summary.
  4. Confirmation statement: `status = accepted/rejected`, timestamp, receiver name.

## 3. Periodic Inspection Summary (Excel)
- Tab per shot milestone (20K, 50K, 80K, 100K, 800K+).
- Columns:
  - `shot_target`, `inspection_date`, `operator`, `checklist_status`, `notes`, `photos_attached`, `cleaning_agent`, `dilution_ratio`, `issue_logged`.
- Each row draws from `daily_check_items` + aggregated `daily_check_item_status`. Include formula column `overlap_flag` to note if item repeated from previous stage.
- Tab called `Photo Index` lists `photo_id`, `checklist_id`, `item_id`, `description`, `file_url` for documentation.

## 4. Daily Evidence Digest (PDF)
- Single-page summary per day per mold.
- Sections: `Basic Info`, `Key Findings` (highest severity items), `Attached Media` (thumbnails for each attached photo/doc from that day's checklist), `Next Steps` (auto note if `issue`/`maintenance_request` created). Includes `sign-off` area for plant supervisor.

---

## Automation Notes
- Backend triggers `POST /reports/generate` (see `API_SPEC.md`) once checklist status transitions to `completed` + `confirmed_by` recorded.
- Templates stored under `/templates/transfer_request.docx`, `/templates/periodic_inspection.xlsx`. Rendering service merges `checklist_data` JSON and `photo_refs` before exporting.
- Each export persists `report_logs` table entry (includes `report_type`, `generated_by`, `generated_at`, `files`) for audit.
