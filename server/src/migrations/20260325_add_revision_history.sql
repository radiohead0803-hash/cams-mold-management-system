-- 표준문서 마스터에 개정 이력 컬럼 추가
ALTER TABLE standard_document_templates 
ADD COLUMN IF NOT EXISTS revision_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN standard_document_templates.revision_history IS '개정 이력 스냅샷 배열';
